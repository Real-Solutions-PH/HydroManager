import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { useTabBarClearance } from "@/components/ui/interactive-menu";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";

type MoreLink = {
	href: "/tasks" | "/library" | "/settings";
	icon: React.ComponentProps<typeof Ionicons>["name"];
	title: string;
	subtitle: string;
};

const LINKS: MoreLink[] = [
	{
		href: "/tasks",
		icon: "checkbox-outline",
		title: "Tasks",
		subtitle: "Daily to-dos, reminders & recurring chores",
	},
	{
		href: "/library",
		icon: "library-outline",
		title: "Library",
		subtitle: "Crop guides, grow guides & pest references",
	},
	{
		href: "/settings",
		icon: "settings-outline",
		title: "Settings",
		subtitle: "Account, preferences & app options",
	},
];

export default function MoreScreen() {
	const colors = useThemeColors();
	const clearance = useTabBarClearance();

	return (
		<GradientBackground>
			<View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.lg }}>
				<Text size="xxl" weight="bold">
					More
				</Text>
				<Text size="sm" tone="muted">
					Tasks, library and settings
				</Text>
			</View>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: clearance,
					gap: spacing.sm,
				}}
			>
				{LINKS.map((link) => (
					<Link key={link.href} href={link.href} asChild>
						<Pressable>
							<Card>
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: spacing.md,
									}}
								>
									<View
										style={{
											width: 44,
											height: 44,
											borderRadius: radii.lg,
											backgroundColor: colors.glass,
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<Ionicons
											name={link.icon}
											size={22}
											color={colors.primary}
										/>
									</View>
									<View style={{ flex: 1 }}>
										<Text size="md" weight="bold">
											{link.title}
										</Text>
										<Text size="xs" tone="muted">
											{link.subtitle}
										</Text>
									</View>
									<Ionicons
										name="chevron-forward"
										size={20}
										color={colors.textMuted}
									/>
								</View>
							</Card>
						</Pressable>
					</Link>
				))}
			</ScrollView>
		</GradientBackground>
	);
}
