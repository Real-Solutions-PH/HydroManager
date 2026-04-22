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
import {
	confirmPasswordRules,
	emailPattern,
	namePattern,
	passwordRules,
} from "@/lib/utils";

interface SignupForm {
	full_name: string;
	email: string;
	password: string;
	confirm_password: string;
}

export default function SignupScreen() {
	const { signup } = useAuth();
	const {
		control,
		handleSubmit,
		getValues,
		formState: { errors },
	} = useForm<SignupForm>({
		defaultValues: {
			full_name: "",
			email: "",
			password: "",
			confirm_password: "",
		},
	});

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
						Create Account
					</Text>

					<Controller
						control={control}
						name="full_name"
						rules={{ required: "Name is required", pattern: namePattern }}
						render={({ field: { onChange, value } }) => (
							<FormField label="Full name" error={errors.full_name?.message}>
								<Input
									value={value}
									onChangeText={onChange}
									placeholder="Jane Doe"
								/>
							</FormField>
						)}
					/>

					<Controller
						control={control}
						name="email"
						rules={{ required: "Email is required", pattern: emailPattern }}
						render={({ field: { onChange, value } }) => (
							<FormField label="Email" error={errors.email?.message}>
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
						rules={passwordRules()}
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

					<Controller
						control={control}
						name="confirm_password"
						rules={confirmPasswordRules(() => getValues())}
						render={({ field: { onChange, value } }) => (
							<FormField
								label="Confirm password"
								error={errors.confirm_password?.message}
							>
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
						label={signup.isPending ? "Creating..." : "Sign Up"}
						onPress={handleSubmit((d) =>
							signup.mutate({
								full_name: d.full_name,
								email: d.email,
								password: d.password,
							}),
						)}
						disabled={signup.isPending}
					/>

					<Link href="/login">
						<Text size="sm" style={{ color: colors.primaryLight }}>
							Already have an account? Log in
						</Text>
					</Link>
				</View>
			</KeyboardAvoidingView>
		</GradientBackground>
	);
}
