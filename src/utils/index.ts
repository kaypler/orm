export function toUrlParams(obj: object): string {
    if (!obj) return '';

    return Object.keys(obj).map((key: string) => {
        return `${key}=${obj[key]}`;
    }).join('&');
}

export function parseUrl(url: string) {
    const arr = url.split('?');
    arr.shift();
    const paramStr = arr.join('');
    const reg = new RegExp(/(^|&)([^&=]*)=([^&]*)(&|$)/, 'g');
    const obj = Object.create(null);

    let r = reg.exec(paramStr);
    while(r !== null) {
        obj[r[2]] = unescape(r[3]);
        r = reg.exec(paramStr);
    }
     
    return obj;
}