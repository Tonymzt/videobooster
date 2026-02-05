import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-4">
                <h1 className="text-center text-3xl font-bold text-gray-900">VideoBooster</h1>
                <SignupForm />
            </div>
        </div>
    );
}
