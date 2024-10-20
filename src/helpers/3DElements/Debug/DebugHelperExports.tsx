import { Object3D } from "three";


export interface DebugHelperObject {
    objects: Object3D[]
    id: string
}

export class DebugHelperConfiguration {
    maxStep?: number|null|undefined = null;
    minStep?: number|null|undefined = null;
    debugVisible?: boolean|null|undefined = null;
}

let configs : Map<string, DebugHelperConfiguration> = new Map<string, DebugHelperConfiguration>();

export function getDebugConfig(id : string) : DebugHelperConfiguration {
    let config = configs.get(id);
    if(!config) {
        config = new DebugHelperConfiguration();
    }
    return config;
}

export function addDebugConfig(id : string, config : DebugHelperConfiguration) {
    configs.set(id, config);
}

let moduleSetter: React.Dispatch<React.SetStateAction<DebugHelperObject[]>> | undefined = undefined;

export function setModuleSetter(fn : React.Dispatch<React.SetStateAction<DebugHelperObject[]>> | undefined) {
    moduleSetter = fn
}

export interface IDebugHelperContext {
    controlValues: any,
}

export function EmptyDebugObject(id: string) {
    const object = new Object3D();
    PushDebugObject(id, object);
}

export function PushDebugObjects(id: string, ...objects: Object3D[]) {
    if(objects.length > 0) {
        const object = new Object3D();
        object.add(...objects);
        PushDebugObject(id, object);
    }
}

export function PushDebugObject(id: string, object: Object3D) {
    if (moduleSetter instanceof Function) {
        moduleSetter((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex(x => x.id === id);
            if (idx !== -1) {
                copy[idx].objects.push(object);
            } else {
                copy.push({ id, objects: [object] });
            }
            return copy;
        });
    }
}

export function ClearDebugObjects() {
    if (moduleSetter instanceof Function) {
        moduleSetter([]);
    }
}

export function ClearDebugObject(id: string) {
    if (moduleSetter instanceof Function) {
        moduleSetter((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex(x => x.id === id);
            if(idx !== -1) {
                copy.splice(idx, 1);
            }
            return copy;
        });
    }
}