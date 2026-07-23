import { useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// The app stores its resolved theme on <html data-viventory-theme>. Mirror it
// so toasts match light/dark without pulling in next-themes.
function useViventoryTheme(): "light" | "dark" {
    const read = (): "light" | "dark" =>
        document.documentElement.dataset.viventoryTheme === "dark" ? "dark" : "light";

    const [theme, setTheme] = useState<"light" | "dark">(read);

    useEffect(() => {
        const observer = new MutationObserver(() => setTheme(read()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-viventory-theme"],
        });
        return () => observer.disconnect();
    }, []);

    return theme;
}

const Toaster = ({ ...props }: ToasterProps) => {
    const theme = useViventoryTheme();

    return (
        <Sonner
            theme={theme}
            className="toaster group"
            {...props}
        />
    );
};

export { Toaster };
