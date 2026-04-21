import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { GradientBackground } from "@/components/ui/gradient-background";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { spacing } from "@/constants/theme";
import { useCustomToast } from "@/hooks/useCustomToast";
import { passwordApi } from "@/lib/hydro-api";
import { confirmPasswordRules, handleError, passwordRules } from "@/lib/utils";

interface ResetForm {
	new_password: string;
	confirm_password: string;
}

export default function ResetPasswordScreen() {
	const toast = useCustomToast();
	const router = useRouter();
	const { token } = useLocalSearchParams<{ token?: string }>();
	const {
		control,
		handleSubmit,
		getValues,
		formState: { errors, isSubmitting },
	} = useForm<ResetForm>({
		defaultValues: { new_password: "", confirm_password: "" },
	});

	const onSubmit = async ({ new_password }: ResetForm) => {
		if (!token) {
			toast.error("Missing reset token");
			return;
		}
		try {
			await passwordApi.reset(token, new_password);
			toast.success("Password reset. Please log in.");
			router.replace("/login");
		} catch (err) {
			toast.error(handleError(err));
		}
	};

	return (
		<GradientBackground>
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					gap: spacing.lg,
					paddingHorizontal: spacing.xl,
				}}
			>
				<Text size="xxxl" weight="bold">
					Reset Password
				</Text>

				<Controller
					control={control}
					name="new_password"
					rules={passwordRules()}
					render={({ field: { onChange, value } }) => (
						<FormField
							label="New password"
							error={errors.new_password?.message}
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
					label={isSubmitting ? "Resetting..." : "Reset Password"}
					onPress={handleSubmit(onSubmit)}
					disabled={isSubmitting}
				/>
			</View>
		</GradientBackground>
	);
}
