const http = require('../utils/http');

class Record<T> {
    readonly id: string
    type: string = ''
    name: string = ''
    begin_time: number = 0
    end_time: number = 0
    description: string = ''
    creator: string = ''
    create_time: number = 0
    update_time: number = 0
    attrs: object

    constructor(attrs: object) {
        this.attrs = attrs;
        for (let key in attrs) {
            this[key] = attrs[key];
        }
    }

    /** 
     * 在服务器端删除当前的记录
     * @returns 返回删除请求是否完成
     */
    destroyRecord() {
        return http.delete(`/${this.type}/${this.id}`);
    }

    /** 放弃所有未保存的记录更改 */
    rollBack() {
        for (let key in this.attrs) {
            this[key] = this.attrs[key];
        }
    }

    /**
     * 在服务端保存最新的更改
     * @returns 返回保存请求是否完成
     */
    save() {
        for (let key in this.attrs) {
            this.attrs[key] = this[key];
        }
        return http.put(`/${this.type}/${this.id}`, this.attrs);
    }
}

export default Record;