import { MockRequest, MockResponse, EventModel, RequestParams } from '../types/index';
import { parseUrl } from '../utils/index';
const Mock = require('mockjs');

const db = []; 
let rid = 0;

const insertReg = new RegExp(/^\/(\w+)$/);
const itemReg = new RegExp(/\/(\w+)\/([^?]+)$/);
const allReg = new RegExp(/\/(\w+)\/\?.*/);
const iterator = function* () {
    yield this.urlReg;
    yield this.method;
    yield this.handler;
};

const proxyApi = {
    // 插入一条记录 /event
    insert: {
        urlReg: insertReg,
        method: 'post',
        handler(options: MockRequest): MockResponse<object> {
            const res = insertReg.exec(options.url);
            const now = new Date();
            let type = null;
            if (res.length) {
                type = res[1];
            }
        
            const newRecord = Object.assign({
                id: String(rid++),
                type,
                create_time: now,
                update_time: now,
                ...JSON.parse(options.body),
            }, Mock.mock({
                'creator': '@clast@cname'
            }));

            db.push(newRecord);
            return {
                code: 200,
                data: newRecord
            };
        },
        [Symbol.iterator]: iterator 
    },
    // 精确查找 /event/1
    query: {
        urlReg: itemReg,
        method: 'get',
        handler(options: MockRequest): MockResponse<object> {
            const res = itemReg.exec(options.url);
            let recordId = '';
            let type = '';
            if (res.length) {
                type = res[1];
                recordId = res[2];
            }
        
            return {
                code: 200,
                data: db.find((item) => item.id === recordId && item.type === type) || -1
            };
        },
        [Symbol.iterator]: iterator    
    },
    // 修改 /event/1
    modify: {
        urlReg: itemReg,
        method: 'put',
        handler(options: MockRequest): MockResponse<EventModel> {
            const res = itemReg.exec(options.url);
            let recordId = '';
            let type = '';
            if (res.length) {
                type = res[1];
                recordId = res[2];
            }
        
            const index = db.findIndex((item) => item.id === recordId && item.type === type);
            const record = Object.assign(db[index], JSON.parse(options.body));
        
            return {
                code: 200,
                data: record
            };
        },
        [Symbol.iterator]: iterator 
    },
    // 删除 /event/1
    delete: {
        urlReg: itemReg,
        method: 'delete',
        handler(options: MockRequest): MockResponse<string> {
            const res = itemReg.exec(options.url);
            let recordId = '';
            let type = '';
            if (res.length) {
                type = res[1];
                recordId = res[2];
            }
        
            const index = db.find((item) => item.id === recordId && item.type === type);
            db.splice(index, 1);
        
            return {
                code: 200,
                msg: 'success'
            };
        },
        [Symbol.iterator]: iterator 
    },
    // 请求派发
    queryList: {
        urlReg: allReg,
        method: 'get',
        handler(options: MockRequest): MockResponse<EventModel[]> {
            const res = allReg.exec(options.url);
            let type = null;
            if (res.length) {
                type = res[1];
            }
        
            const params = parseUrl(options.url);
            const {
                offset = 0,
                limit = 10,
                ...rest
            } = params;
        
            const records = db.filter(item => {
                for (const key in rest) {
                    if (item[key] !== undefined && item[key] !== rest[key]) {
                        return false;
                    }
                }
        
                return item.type === type;
            }).slice(offset, offset+limit);
        
            return {
                code: 200,
                data: records
            };
        },
        [Symbol.iterator]: iterator 
    }
};

// 请求派发
Mock.mock('/batchRequest', 'post', (options: MockRequest): MockResponse<Array<MockResponse<any>>> => {
    // console.log(options);
    const responseData = [];
    const { requests } = JSON.parse(options.body);

    requests.forEach((request: RequestParams) => {
        const { url, method, body } = request;
        const type = method.toLowerCase();

        switch(true) {
            case proxyApi.insert.urlReg.test(request.url):
                responseData.push(proxyApi.insert.handler({url, type, body: JSON.stringify(body)}));
                break;
            case proxyApi.query.urlReg.test(request.url) && type === proxyApi.query.method:
                responseData.push(proxyApi.query.handler({url, type, body: JSON.stringify(body)}));
                break;
            case proxyApi.modify.urlReg.test(request.url) && type === proxyApi.modify.method:
                responseData.push(proxyApi.modify.handler({url, type, body: JSON.stringify(body)}));
                break;
            case proxyApi.delete.urlReg.test(request.url) && type === proxyApi.delete.method:
                responseData.push(proxyApi.delete.handler({url, type, body: JSON.stringify(body)}));
                break;
            case proxyApi.queryList.urlReg.test(request.url):
                responseData.push(proxyApi.queryList.handler({url, type, body: JSON.stringify(body)}));
                break;                
            default:
                break;    
        }
    });

    return {
        code: 200,
        data: responseData
    };
});


// 具体请求处理
Object.keys(proxyApi).forEach(key => {
    Mock.mock(...proxyApi[key]);
});
