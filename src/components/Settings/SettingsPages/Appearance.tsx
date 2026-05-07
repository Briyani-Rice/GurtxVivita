import { SettingsPage } from "../Settings";

const Appearance: SettingsPage = {
    name: "Appearance",

    content: (
        <div>
            <h3>Appearance</h3>
            <p>Customize the app's appearance</p>
        </div>
    ),

    save: () => {
        return {};
    }
};

export default Appearance;