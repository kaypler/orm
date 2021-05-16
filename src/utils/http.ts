import { RequestParams, MockResponse } from '../types/index';

const callbacks = [];
let pending = false;

// 请求都放在队列里，等待下一次事件循环批量执行
function inLoop(params: RequestParams) {
    return new Promise((resolve: Function, reject: Function) => {
        callbacks.push({request: params, resolve, reject});

        if (!pending) {
            pending = true;
            // 下次宏任务执行这些请求
            setTimeout(batchRequest, 0);
        }
    });
}

// 批量请求
function batchRequest() {
    // 重置请求锁
    pending = false;
    // 复制并清空原回调队列
    const copies = callbacks.slice(0);
    callbacks.length = 0;

    const requests = new Array<RequestParams>();
    for (let i = 0; i < copies.length; i++) {
        requests.push(copies[i].request);
    }

    request('POST', '/batchRequest', { requests }).then((responseList: []) => {
        responseList.forEach((response: MockResponse<any>, index: number) => {
            if (response.code === 200) {
                copies[index].resolve(response.data);
            } else {
                copies[index].reject(response);
            }   
        });
    });
}

// 发送异步请求的方法
function request(method: string, url: string, params?: object) {
    method = method.toUpperCase();
    console.log('request: ', JSON.stringify({
        url, method, params
    }));
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                console.log('response: ', xhr.responseText);
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.code === 200) {
                        resolve(response.data);
                    } else {
                        reject(response);
                    }
                } else {
                    reject(xhr);
                }
            }
        };
        

        xhr.open(method, url);
        if (method === 'POST' || method === 'PUT') {
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            xhr.send(JSON.stringify(params));
        } else {
            xhr.send(null);
        }    
    });  
}


module.exports = {
    get(url: string) {
        return inLoop({
            url,
            method: 'GET',
            body: null
        });
    },
    delete(url: string) {
        return inLoop({
            url,
            method: 'DELETE',
            body: null
        });
    },
    post(url: string, params: object) {
        return inLoop({
            url,
            method: 'POST',
            body: params
        });
    },
    put(url: string, params: object) {
        return inLoop({
            url,
            method: 'PUT',
            body: params
        });
    }
};