interface NameSpaceObject {
    name: string
    type: string
};

export default class Namespace {
    private parent:   Namespace | null;
    private children: Namespace[];
    private pushedAt: number | null;
    private poppedAt: number | null;
    private objs:     NameSpaceObject[];

    constructor(parent: Namespace | null = null) {
        this.parent   = parent;
        this.children = [];
        this.pushedAt = null;
        this.poppedAt = null;
        this.objs     = [];
    }

    createChildScope(pushedAt: number) {
        const child = new Namespace(this);
        this.pushedAt = pushedAt;
        this.children.push(child);
        return child;
    }

    escapeScope(poppedAt?: number) {
        if (!this.parent) return this;

        if (poppedAt) this.poppedAt = poppedAt;
        return this.parent;
    }

    getGlobalScope() {
        let ns: Namespace = this;
        for (; ns.parent; ns = this.escapeScope());
        return ns;
    }

    append(objName: string, type: string) {
        if (this.hasName(objName, true)) return false;
        
        this.objs.push({ name: objName, type });
        return true;
    }

    register(str: string, type: string) {
        const objNames = str.split(/\s+/);
        objNames.forEach(objName => this.append(objName, type));

        return this;
    }

    has(objName: string, type: string, currScopeOnly = false): boolean {
        const foundInCurrScope = this.objs.some((obj) => 
            obj.name === objName && obj.type === type
        );
    
        if (foundInCurrScope) return true;
    
        return !currScopeOnly && this.parent?.has(objName, type) || false;
    }

    getTypeByName(name: string, currScopeOnly = false): string | null {
        const foundInCurrScope = this.objs.find((obj) => obj.name === name);

        if (foundInCurrScope) return foundInCurrScope.type;

        return !currScopeOnly && this.parent ? this.parent.getTypeByName(name) : null;
    }

    // For test
    toJSON(): any {
        return {
            objs: this.objs,
            children: this.children.map((child) => child.toJSON()),
        };
    }

    private hasName(objName: string, currScopeOnly = false): boolean {
        const foundInCurrScope = this.objs.some((obj) => 
            obj.name === objName
        );
    
        if (foundInCurrScope) return true;
    
        return !currScopeOnly && this.parent?.hasName(objName) || false;
    }
}