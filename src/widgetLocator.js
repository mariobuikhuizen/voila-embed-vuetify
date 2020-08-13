const widgetResolveFns = {};
const widgetPromises = {};

function keyFromMountPath(obj) {
    return `${obj.voilaUrl}${obj.notebook}${obj.mountId}`;
}

export function provideWidget(mountPath, widgetModel) {
    const key = keyFromMountPath(mountPath);
    if (widgetResolveFns[key]) {
        widgetResolveFns[key](widgetModel);
    } else {
        widgetPromises[key] = Promise.resolve(widgetModel);
    }
}

export function requestWidget(mountPath) {
    const key = keyFromMountPath(mountPath);

    if (!widgetPromises[key]) {
        widgetPromises[key] = new Promise((resolve) => { widgetResolveFns[key] = resolve; });
    }
    return widgetPromises[key];
}
