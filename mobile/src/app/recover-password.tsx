import { useRouter } from "expo-router";
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
import { emailPattern, handleError } from "@/lib/utils";

interface RecoverForm {
	email: string;
}

export default function RecoverPasswordScreen() {
	const toast = useCustomToast();
	const router = useRouter();
	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RecoverForm>({ defaultValues: { email: "" } });

	const onSubmit = async ({ email }: RecoverForm) => {
		try {
			await passwordApi.recover(email);
			toast.success("Recovery email sent");
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
					Recover Password
				</Text>
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
				<Button
					label={isSubmitting ? "Sending..." : "Send Recovery Email"}
					onPress={handleSubmit(onSubmit)}
					disabled={isSubmitting}
				/>
			</View>
		</GradientBackground>
	);
}
