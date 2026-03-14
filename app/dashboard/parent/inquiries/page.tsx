import { RequireAuth } from "@/components/RequireAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarClock, MessageCircle, MapPin } from "lucide-react"

type InquiryStatus = "pending" | "contacted" | "completed"

type Inquiry = {
  id: number
  provider: string
  childAge: string
  preferredStartDate: string
  messagePreview: string
  date: string
  status: InquiryStatus
}

const inquiries: Inquiry[] = [
  {
    id: 1,
    provider: "Sunrise Montessori Preschool",
    childAge: "3 years",
    preferredStartDate: "August 15, 2026",
    messagePreview:
      "Hi! We&apos;d love to learn more about your toddler program and schedule a tour...",
    date: "Today · 9:24 AM",
    status: "pending",
  },
  {
    id: 2,
    provider: "Little Oaks Learning Center",
    childAge: "18 months",
    preferredStartDate: "September 1, 2026",
    messagePreview:
      "I&apos;m curious about your infant room and whether you have any openings for 3 days a week...",
    date: "Yesterday",
    status: "contacted",
  },
  {
    id: 3,
    provider: "Greenway Nature Preschool",
    childAge: "4 years",
    preferredStartDate: "August 22, 2026",
    messagePreview:
      "We love the idea of a nature-based program. Could you share more about your daily routine...",
    date: "Mar 9, 2026",
    status: "completed",
  },
]

function statusBadge(status: InquiryStatus) {
  if (status === "pending") {
    return (
      <Badge className="bg-secondary/20 text-secondary-foreground hover:bg-secondary/20">
        Pending reply
      </Badge>
    )
  }
  if (status === "contacted") {
    return (
      <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
        In conversation
      </Badge>
    )
  }
  return (
    <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
      Completed
    </Badge>
  )
}

export default function ParentInquiriesPage() {
  return (
    <RequireAuth>
      <div className="space-y-6 lg:space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
            My inquiries
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            View and keep track of the messages you&apos;ve sent to childcare providers. When
            you&apos;re done with a conversation, you can mark it as completed.
          </p>
        </div>

        <Card className="border-none bg-primary/10 rounded-3xl shadow-sm shadow-primary/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 lg:p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Tours on the calendar?
              </p>
              <p className="text-xs text-muted-foreground">
                After you visit a provider, mark the conversation as completed so your inbox stays
                focused on what&apos;s next.
              </p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full border-primary/30 text-primary">
              View upcoming visits
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card
              key={inquiry.id}
              className="border border-border/60 bg-card rounded-3xl shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm lg:text-base font-semibold text-foreground">
                    {inquiry.provider}
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      Austin area
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5 text-secondary" />
                      Preferred start · {inquiry.preferredStartDate}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {statusBadge(inquiry.status)}
                  <span className="text-[11px] text-muted-foreground">{inquiry.date}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl bg-muted/50 px-3.5 py-3 text-xs text-muted-foreground flex gap-2">
                  <div className="mt-1">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <p className="leading-relaxed">
                    {inquiry.messagePreview}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground">
                    Child age: <span className="font-medium">{inquiry.childAge}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="rounded-full">
                      View conversation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-border/60 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Mark as completed
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </RequireAuth>
  )
}

