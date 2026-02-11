import { LicenseInput } from '@/components/settings/LicenseInput'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function AccountSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">License activation and trial status</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">License</CardTitle>
          <CardDescription>Activate your license with the email used at purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <LicenseInput />
        </CardContent>
      </Card>
    </div>
  )
}
