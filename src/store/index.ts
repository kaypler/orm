import { toUrlParams } from '../utils/index';
import Record from './record';
const uniqBy = require('lodash/uniqBy');
const http = require('../utils/http');

class Store {
    private cache: Map<string, Array<Record<any>>>;

    constructor () {
        this.cache = new Map();
    }

    /**
     * 创建一个指定类型的 Record
     * @param type 
     * @param attrs 
     * @returns 具有指定类型的 Record
     */
    createRecord (type: string, attrs: object): Promise<Record<any>> {
        return new Promise((resolve: Function) => {
            http.post(`/${type}`, attrs).then((data) => {
                resolve(new Record(data));
            });
        });
    }

    /**
     * 定义一个记录模型
     * @param type 
     * @param attrs 
     */
    defineModel<T> (type: string, attrs: T) {
        if (this.cache.has(type)) return;

        const list = new Array<Record<T>>();
        this.cache.set(type, list);
    }

    /**
     * 从缓存中查询一条记录
     * @param type 
     * @param id 
     * @returns 从缓存中查询到的记录。如果缓存中没有，则去服务器查询并缓存
     */
    findRecord (type: string, id: string): Promise<Record<any>> {
        return new Promise((resolve: Function) => {
            const records = this.cache.get(type) || [];
            const index = records.findIndex((item: Record<any>) => item.id === id);

            if (index !== -1) {
                resolve(records[index]);
            } else {
                http.get(`/${type}/${id}`).then((data: Record<any>) => {
                    resolve(new Record(data));
                });
            }
        });
    }

    /**
     * 根据条件查询一组记录（不通过缓存查询，并将结果保存至缓存）
     * @param type 
     * @param params 
     * @returns 包含服务器数据的记录集
     */
    query (type: string, params: object) {
        return new Promise((resolve: Function, reject: Function) => {
            http.get(`/${type}/?${toUrlParams(params)}`).then((list: Array<Record<any>>) => {
                const newRecords = list.map(item => new Record(item));
                const records = this.cache.get(type) || [];
                this.cache.set(type, uniqBy(records.concat(newRecords), 'id'));
                resolve(newRecords);
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * 查询一条记录（不通过缓存查询，并将结果保存至缓存）
     * @param type 
     * @param id 
     * @returns 包含服务器数据的记录
     */
    queryRecord (type: string, id: object) {
        return new Promise((resolve: Function) => {
            http.get(`/${type}/${id}`).then((data: Record<any>) => {
                const record = new Record(data);
                const records = this.cache.get(type) || [];
                const index = records.findIndex((item: Record<any>) => item.id === record.id);
                if (index !== -1) {
                    records.splice(index, 1, record);
                } else {
                    records.push(record);
                }
                resolve(record);
            });
        });
    }

    /** 清空所有缓存的记录 */
    unloadAll () {
        this.cache.clear();
    }
}
export default Store;
