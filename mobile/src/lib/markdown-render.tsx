import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";

export function MarkdownRender({ source }: { source: string }) {
	const lines = source.split(/\r?\n/);
	const blocks: React.ReactNode[] = [];
	let listBuffer: string[] = [];
	let tableBuffer: string[] = [];

	const flushList = () => {
		if (!listBuffer.length) return;
		blocks.push(
			<View key={`list-${blocks.length}`} style={{ gap: 4 }}>
				{listBuffer.map((item, i) => (
					<View
						// biome-ignore lint/suspicious/noArrayIndexKey: parsed markdown content has no stable id
						key={`li-${blocks.length}-${i}`}
						style={{ flexDirection: "row", gap: spacing.xs }}
					>
						<Text
							size="md"
							weight="bold"
							style={{ color: colors.primaryLight }}
						>
							•
						</Text>
						<Text size="sm" tone="subtle" style={{ flex: 1 }}>
							{item}
						</Text>
					</View>
				))}
			</View>,
		);
		listBuffer = [];
	};

	const flushTable = () => {
		if (!tableBuffer.length) {
			return;
		}
		const rows = tableBuffer
			.map((r) =>
				r
					.split("|")
					.map((c) => c.trim())
					.filter((c) => c.length),
			)
			.filter((r) => r.length && !r.every((c) => /^-+$/.test(c)));
		blocks.push(
			<View
				key={`table-${blocks.length}`}
				style={{
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: 12,
					overflow: "hidden",
				}}
			>
				{rows.map((row, ri) => (
					<View
						// biome-ignore lint/suspicious/noArrayIndexKey: parsed markdown rows have no stable id
						key={`tr-${blocks.length}-${ri}`}
						style={{
							flexDirection: "row",
							borderBottomWidth: ri === rows.length - 1 ? 0 : 1,
							borderColor: colors.border,
							backgroundColor: ri === 0 ? colors.glass : "transparent",
						}}
					>
						{row.map((cell, ci) => (
							<View
								// biome-ignore lint/suspicious/noArrayIndexKey: parsed markdown cells have no stable id
								key={`td-${blocks.length}-${ri}-${ci}`}
								style={{
									flex: 1,
									padding: spacing.xs,
									borderRightWidth: ci === row.length - 1 ? 0 : 1,
									borderColor: colors.border,
								}}
							>
								<Text size="xs" weight={ri === 0 ? "semibold" : "normal"}>
									{cell}
								</Text>
							</View>
						))}
					</View>
				))}
			</View>,
		);
		tableBuffer = [];
	};

	for (const raw of lines) {
		const line = raw.trimEnd();
		if (line.startsWith("|")) {
			flushList();
			tableBuffer.push(line);
			continue;
		}
		flushTable();

		if (!line.trim()) {
			flushList();
			continue;
		}
		if (line.startsWith("## ")) {
			flushList();
			blocks.push(
				<Text
					key={`h2-${blocks.length}`}
					size="lg"
					weight="bold"
					style={{ marginTop: spacing.sm }}
				>
					{line.slice(3)}
				</Text>,
			);
		} else if (line.startsWith("# ")) {
			flushList();
			blocks.push(
				<Text
					key={`h1-${blocks.length}`}
					size="xl"
					weight="bold"
					style={{ marginTop: spacing.sm }}
				>
					{line.slice(2)}
				</Text>,
			);
		} else if (line.startsWith("### ")) {
			flushList();
			blocks.push(
				<Text
					key={`h3-${blocks.length}`}
					size="md"
					weight="semibold"
					style={{ marginTop: spacing.xs }}
				>
					{line.slice(4)}
				</Text>,
			);
		} else if (line.startsWith("- ") || line.startsWith("* ")) {
			listBuffer.push(stripInline(line.slice(2)));
		} else if (/^\d+\. /.test(line)) {
			listBuffer.push(stripInline(line.replace(/^\d+\. /, "")));
		} else {
			flushList();
			blocks.push(
				<Text key={`p-${blocks.length}`} size="sm" tone="subtle">
					{stripInline(line)}
				</Text>,
			);
		}
	}
	flushList();
	flushTable();

	return <View style={{ gap: spacing.xs }}>{blocks}</View>;
}

function stripInline(s: string): string {
	return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`(.+?)`/g, "$1");
}
