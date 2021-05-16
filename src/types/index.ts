// 事件模型
export type EventModel = {
    name: '',
    begin_time: 0,
    end_time: 0,
    description: '',
    creator: null,
    create_time: 0,
    update_time: 0
};

// 批量请求参数
export interface RequestParams {
    url: string;
    method: string;  //请求类型
    body: object | null;  //请求体
}

// 请求实体
export interface MockRequest {
    url: string;
    type: string;  //请求类型
    body: string | null;  //请求体
}

export interface MockResponse<T> {
    code: number;
    data?: T;
    msg?: string;
}