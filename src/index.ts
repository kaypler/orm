require('./mock/index');
import { EventModel } from './types/index';
import Store from './store/index';
import Record from './store/record';

const store = new Store();

// 定义一个记录模型
store.defineModel<EventModel>('event', {
    name: '',
    begin_time: 0,
    end_time: 0,
    description: '',
    creator: null,
    create_time: 0,
    update_time: 0
});

// 创建一个指定类型的记录
Promise.all([
    store.createRecord('event', {
        name: '点击',
        description: '这是点击事件'
    }),
    store.createRecord('event', {
        name: '滚动',
        description: '这是滚动事件'
    }),
]).then((records: Array<Record<EventModel>>) => {
    // 根据条件查询一组记录
    store.query('event', {
        limit: 10,
        offset: 0
    }).then(recordList => {
        console.log('store.query: ', recordList);
    });

    // 从缓存中查询一条记录
    store.findRecord('event', '0').then((record: Record<EventModel>) => {
        console.log('store.findRecord: ', record);
        record.name = 'ss';
        console.log('modify record: ', record);

        // 回滚记录
        record.rollBack();
        console.log('record.rollBack: ', record);
        record.creator = 'dxw';
        // 保存更改
        record.save();
        console.log('record.save: ', record);

        // 删除记录
        record.destroyRecord();
    });
});


