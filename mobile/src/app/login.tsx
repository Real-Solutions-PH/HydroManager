import { Image } from "expo-image";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { radii, spacing, useThemeColors } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { emailPattern } from "@/lib/utils";

interface LoginForm {
	username: string;
	password: string;
}

export default function LoginScreen() {
	const { login } = useAuth();
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginForm>({
		defaultValues: { username: "", password: "" },
	});

	const onSubmit = (data: LoginForm) => login.mutate(data);

	return (
		<View style={{ flex: 1, backgroundColor: colors.primaryDeep }}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{ flex: 1 }}
			>
				<ScrollView
					contentContainerStyle={{ flexGrow: 1 }}
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{/* Brand header band */}
					<View
						style={{
							backgroundColor: colors.primaryDeep,
							paddingTop: insets.top + spacing.lg,
							paddingHorizontal: spacing.xl,
							paddingBottom: spacing.xxxl,
						}}
					>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								gap: spacing.md,
							}}
						>
							<View style={{ flex: 1, gap: spacing.xxs }}>
								<Text
									size="xxxl"
									weight="heavy"
									style={{ color: "#FFFFFF", lineHeight: 36 }}
								>
									Bot-choy - Hydroponics Manager
								</Text>
								<Text
									size="md"
									style={{ color: "rgba(255, 255, 255, 0.75)" }}
								>
									Grow smarter, harvest stronger.
								</Text>
							</View>
							<Image
								source={require("../../assets/character/saying_hi.png")}
								style={{ width: 96, height: 110 }}
								contentFit="contain"
								accessibilityIgnoresInvertColors
							/>
						</View>
					</View>

					{/* Form panel */}
					<View
						style={{
							flex: 1,
							backgroundColor: colors.bg,
							borderTopLeftRadius: radii.xxl,
							borderTopRightRadius: radii.xxl,
							marginTop: -spacing.xl,
							paddingTop: spacing.xxl,
							paddingHorizontal: spacing.xl,
							paddingBottom: insets.bottom + spacing.xl,
							gap: spacing.lg,
						}}
					>
						<View style={{ gap: spacing.xxs }}>
							<Text size="xxl" weight="bold">
								Welcome back
							</Text>
							<Text size="sm" tone="muted">
								Log in to continue tending your crops.
							</Text>
						</View>

						<Controller
							control={control}
							name="username"
							rules={{ required: "Email is required", pattern: emailPattern }}
							render={({ field: { onChange, value } }) => (
								<FormField label="Email" error={errors.username?.message}>
									<Input
										value={value}
										onChangeText={onChange}
										placeholder="you@example.com"
										autoCapitalize="none"
										keyboardType="email-address"
										autoComplete="email"
										textContentType="emailAddress"
										invalid={!!errors.username}
									/>
								</FormField>
							)}
						/>

						<Controller
							control={control}
							name="password"
							rules={{ required: "Password is required" }}
							render={({ field: { onChange, value } }) => (
								<FormField label="Password" error={errors.password?.message}>
									<Input
										value={value}
										onChangeText={onChange}
										placeholder="********"
										secureTextEntry
										autoComplete="password"
										textContentType="password"
										invalid={!!errors.password}
									/>
								</FormField>
							)}
						/>

						<Link href="/recover-password" style={{ alignSelf: "flex-end" }}>
							<Text size="sm" weight="semibold" tone="primary">
								Forgot password?
							</Text>
						</Link>

						<Button
							size="lg"
							label={login.isPending ? "Logging in..." : "Log In"}
							onPress={handleSubmit(onSubmit)}
							isLoading={login.isPending}
							isDisabled={login.isPending}
						/>

						<View
							style={{
								flexDirection: "row",
								justifyContent: "center",
								gap: spacing.xxs,
								marginTop: spacing.xs,
							}}
						>
							<Text size="sm" tone="muted">
								New to Bot-choy?
							</Text>
							<Link href="/signup">
								<Text size="sm" weight="semibold" tone="primary">
									Sign up
								</Text>
							</Link>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}
