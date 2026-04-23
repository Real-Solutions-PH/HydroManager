import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { emailPattern } from "@/lib/utils";

interface LoginForm {
	username: string;
	password: string;
}

export default function LoginScreen() {
	const { login } = useAuth();
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginForm>({
		defaultValues: { username: "", password: "" },
	});

	const onSubmit = (data: LoginForm) => login.mutate(data);

	return (
		<GradientBackground>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={{
					flex: 1,
					justifyContent: "center",
					paddingHorizontal: spacing.xl,
				}}
			>
				<View style={{ gap: spacing.lg }}>
					<Text size="xxxl" weight="bold">
						Log In
					</Text>

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
								/>
							</FormField>
						)}
					/>

					<Button
						label={login.isPending ? "Logging in..." : "Log In"}
						onPress={handleSubmit(onSubmit)}
						disabled={login.isPending}
					/>

					<View
						style={{ flexDirection: "row", justifyContent: "space-between" }}
					>
						<Link href="/signup">
							<Text size="sm" style={{ color: colors.primaryLight }}>
								Sign up
							</Text>
						</Link>
						<Link href="/recover-password">
							<Text size="sm" style={{ color: colors.primaryLight }}>
								Forgot password?
							</Text>
						</Link>
					</View>
				</View>
			</KeyboardAvoidingView>
		</GradientBackground>
	);
}
