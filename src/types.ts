
export interface Renderable {
    render(): void;
}

export type MaterialStockStatus = "in-stock" | "low" | "out-of-stock" | "wishlist" | "missing";

export interface Material {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    compartmentId: string;
    createdAt: string;
    // Structured fields parsed from the bulk inventory import
    // (see src/utils/materialDetails.ts).
    category?: string;
    location?: string;
    storage?: string;
    supplier?: string;
    cricut?: boolean;
    stockStatus?: MaterialStockStatus;
}

export type ElementType = 'compartment' | 'outofbounds' | 'stairs' | 'lift' | 'chair' | 'table' | 'workplace';

export interface FloorElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    number?: string;
    name?: string;
    color?: string;
    label?: string;
}

export interface FloorData {
    id: string;
    name: string;
    elements: FloorElement[];
}

export interface Compartment {
    id: string;
    number: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}

export interface MaterialRequest {
    id: string;
    materialId: string;
    materialName: string;
    requestedQuantity: number;
    reason: string;
    status: 'pending' | 'approved' | 'declined' | 'returned';
    createdAt: string;
    respondedAt?: string;
    comments?: string;
}

export enum UserPerms {
    Basic,  // regular user — UserView
    Staff,  // admin      — AdminView
}

export class User {
    private username: string;
    private pass: string;
    private perms: UserPerms; // ← was missing, caused getPerms() to crash

    // Hardcoded demo accounts — swap for an API call in production
    static DEMO_ACCS: User[] = [
        new User('User', 'User12345', UserPerms.Staff),
    ];

    // Private so callers must go through User.login()
    private constructor(username: string, password: string, perms: UserPerms) {
        this.username = username;
        this.pass     = password;
        this.perms    = perms;
    }

    getUsername(): string { return this.username; }

    getPerms(): UserPerms { return this.perms; }

    isPassword(password: string): boolean {
        return this.pass === password;
    }

    setPassword(currentPassword: string, newPassword: string): void {
        if (this.isPassword(currentPassword)) this.pass = newPassword;
    }

    /** Returns the matching User or null on bad credentials */
    static login(username: string, password: string): User | null {
        return User.DEMO_ACCS.find(
            u => u.username === username && u.pass === password
        ) ?? null;
    }
}

//App

export interface Tab{
    id: string
    name: string;
    content: React.ReactNode;
}

export enum CommandArgumentType{
    String,
    Number,
    Boolean,
}

export class CommandArgument{
    Name:string;
    Type:CommandArgumentType
    constructor(Name: string, Type: CommandArgumentType) {
        this.Name = Name;
        this.Type = Type;
    }
}

export interface Command{
    id: string;
    args: CommandArgument[];
    name: string;
    onRun: ()=>void;
}

export type BasicDataProps = {
    floorDatas:FloorData[],
    materRequest:MaterialRequest[]
}

export enum Language {
    English="English",
    Chinese = "中文",
    Japanese = "日本語",
    Malay = "Melayu",
    Tamil = "தமிழ்"
}
