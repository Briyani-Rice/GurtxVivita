import {Tab} from "../types.ts"
export class LoginViewTab implements Tab {
    id: string = crypto.randomUUID();

    name: string = "Login";

    content: React.ReactNode = (
        <LoginView
            onLogin={(user: User) => {
                console.log(
                    `Logged in as ${user.getUsername()} with perms ${user.getPerms()}`
                );

                // Example permission handling
                if (user.getPerms() === 1) {
                    console.log("Admin login");
                } else {
                    console.log("User login");
                }
            }}
        />
    );
}