import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/constants/theme";

interface ProgressRingProps {
    size: number;
    progress: number; // 0..1
    strokeWidth?: number;
    color?: string;
    trackColor?: string;
    children?: ReactNode;
}

export function ProgressRing({
    size,
    progress,
    strokeWidth = 6,
    color = colors.primaryLight,
    trackColor = colors.glass,
    children,
}: ProgressRingProps) {
    const clamped = Math.max(0, Math.min(1, progress));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - clamped);
    const center = size / 2;
    const percent = Math.round(clamped * 100);

    return (
        <View
            style={{ width: size, height: size }}
            accessibilityRole="progressbar"
            accessibilityValue={{ now: percent, min: 0, max: 100 }}
        >
            <Svg width={size} height={size}>
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </Svg>
            {children ? (
                <View
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {children}
                </View>
            ) : null}
        </View>
    );
}
