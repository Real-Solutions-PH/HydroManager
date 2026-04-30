import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { BookOpen, Bug, type LucideIcon, Sprout } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";

type Section = {
	href: "/library/crops" | "/library/guides" | "/library/pests";
	title: string;
	subtitle: string;
	icon: LucideIcon;
	accent: string;
};

const SECTIONS: Section[] = [
	{
		href: "/library/crops",
		title: "Crops & Care",
		subtitle:
			"Detailed grow profiles, EC by stage, pricing, tips, risks and stage-by-stage guides.",
		icon: Sprout,
		accent: colors.primaryLight,
	},
	{
		href: "/library/guides",
		title: "Guides & How-to",
		subtitle:
			"Operational playbooks for owners and staff: nutrients, setups, pricing, biosecurity.",
		icon: BookOpen,
		accent: colors.info,
	},
	{
		href: "/library/pests",
		title: "Pests & Diseases",
		subtitle:
			"Identify symptoms, learn causes, and apply prevention or treatment.",
		icon: Bug,
		accent: colors.warning,
	},
];

export default function LibraryIndex() {
	return (
		<GradientBackground>
			<ScrollView
				contentContainerStyle={{
					padding: spacing.md,
					paddingBottom: spacing.jumbo * 2,
					gap: spacing.sm,
				}}
			>
				<View style={{ marginBottom: spacing.xs }}>
					<Text size="xxl" weight="bold">
						Library
					</Text>
					<Text size="sm" tone="muted">
						Reference material for owners and staff.
					</Text>
				</View>
				{SECTIONS.map((s) => (
					<Link key={s.href} href={s.href} asChild>
						<Card onPress={() => {}}>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: spacing.md,
								}}
							>
								<View
									style={{
										width: 56,
										height: 56,
										borderRadius: 16,
										backgroundColor: `${s.accent}26`,
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<s.icon size={28} color={s.accent} strokeWidth={2.2} />
								</View>
								<View style={{ flex: 1 }}>
									<Text size="lg" weight="semibold">
										{s.title}
									</Text>
									<Text size="xs" tone="muted" style={{ marginTop: 2 }}>
										{s.subtitle}
									</Text>
								</View>
								<Ionicons
									name="chevron-forward"
									size={20}
									color={colors.textMuted}
								/>
							</View>
						</Card>
					</Link>
				))}
			</ScrollView>
		</GradientBackground>
	);
}
