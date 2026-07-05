"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "./utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
    [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
} & (
    | { color?: string; theme?: never }
    | { color?: never; theme?: Partial<Record<keyof typeof THEMES, string>> }
    );
};

type ChartContextProps = {
    config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) throw new Error("useChart must be used within ChartContainer");
    return context;
}
function ChartContainer({
                            id,
                            className,
                            children,
                            config,
                            ...props
                        }: React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ReactNode;
}) {
    const uid = React.useId();
    const chartId = `chart-${id || uid.replace(/:/g, "")}`;

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-chart={chartId}
                className={cn(
                    "flex aspect-video justify-center text-xs",
                    className
                )}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
}

function ChartStyle({
                        id,
                        config,
                    }: {
    id: string;
    config: ChartConfig;
}) {
    const entries = Object.entries(config).filter(([, c]) => c.color || c.theme);

    if (!entries.length) return null;

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: Object.entries(THEMES)
                    .map(([theme, prefix]) => {
                        const vars = entries
                            .map(([key, value]) => {
                                const color =
                                    value.theme?.[theme as keyof typeof value.theme] ??
                                    value.color;
                                return color ? `--color-${key}:${color};` : "";
                            })
                            .join("\n");

                        return `${prefix} [data-chart=${id}] { ${vars} }`;
                    })
                    .join("\n"),
            }}
        />
    );
}
type TooltipItem = {
    name?: string;
    value?: any;
    dataKey?: string;
    color?: string;
    payload?: any;
};

type ChartTooltipContentProps = {
    active?: boolean;
    payload?: TooltipItem[];
    label?: any;
    labelFormatter?: (label: any, payload: TooltipItem[]) => React.ReactNode;
    formatter?: (
        value: any,
        name: string,
        item: TooltipItem,
        index: number,
        payload: TooltipItem[]
    ) => React.ReactNode;
    hideLabel?: boolean;
    indicator?: "dot" | "line" | "dashed" | "none";
    className?: string;
};

function ChartTooltipContent(props: ChartTooltipContentProps) {
    const {
        active,
        payload = [],
        label,
        labelFormatter,
        formatter,
        hideLabel,
        indicator = "dot",
        className,
    } = props;

    const { config } = useChart();

    if (!active || !payload?.length) return null;

    return (
        <div className={cn("rounded-md border bg-background p-2 text-xs", className)}>
            {!hideLabel && (
                <div className="mb-1 font-medium">
                    {labelFormatter ? labelFormatter(label, payload) : label}
                </div>
            )}

            {payload.map((item, index) => {
                const key = item.dataKey || item.name || "value";
                const itemConfig = config[key];

                return (
                    <div key={`${key}-${index}`} className="flex items-center gap-2">
                        {indicator !== "none" && (
                            <div
                                className={cn("h-2 w-2 rounded-[2px]", {
                                    "rounded-full": indicator === "dot",
                                })}
                                style={{ backgroundColor: item.color }}
                            />
                        )}

                        <span className="text-muted-foreground">
              {itemConfig?.label || item.name}
            </span>

                        <span className="ml-auto font-mono">
              {formatter
                  ? formatter(item.value, item.name || "", item, index, payload)
                  : item.value}
            </span>
                    </div>
                );
            })}
        </div>
    );
}

const ChartTooltip = RechartsPrimitive.Tooltip;
type LegendItem = {
    value?: string;
    color?: string;
    dataKey?: string;
};

type ChartLegendContentProps = {
    payload?: LegendItem[];
    className?: string;
};

function ChartLegendContent({
                                payload = [],
                                className,
                            }: ChartLegendContentProps) {
    const { config } = useChart();

    if (!payload.length) return null;

    return (
        <div className={cn("flex items-center gap-4", className)}>
            {payload.map((item, index) => {
                const key = item.dataKey || item.value || "value";
                const itemConfig = config[key];

                return (
                    <div key={`${key}-${index}`} className="flex items-center gap-2">
                        <div
                            className="h-2 w-2 rounded-[2px]"
                            style={{ backgroundColor: item.color }}
                        />
                        <span>{itemConfig?.label || item.value}</span>
                    </div>
                );
            })}
        </div>
    );
}

const ChartLegend = RechartsPrimitive.Legend;