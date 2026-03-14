"use client"

import { useState } from "react"
import { Mail, Phone, Calendar, MessageSquare, Check, User, Baby } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const inquiries = [
  {
    id: 1,
    parentName: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "(555) 234-5678",
    childAge: "2 years",
    preferredStart: "April 2026",
    message: "Hi, I'm interested in your toddler program. Do you have any openings starting in April? We're looking for full-time care, Monday through Friday. Our daughter is very active and loves outdoor play. Could you also let me know about your daily schedule and meal options?",
    date: "Today, 2:30 PM",
    status: "new"
  },
  {
    id: 2,
    parentName: "Michael Chen",
    email: "m.chen@email.com",
    phone: "(555) 345-6789",
    childAge: "4 years",
    preferredStart: "September 2026",
    message: "We're looking for a preschool program starting in September. Can you tell me more about your curriculum and how you prepare children for kindergarten? Also interested in your Mandarin language program if available.",
    date: "Today, 11:15 AM",
    status: "new"
  },
  {
    id: 3,
    parentName: "Emily Williams",
    email: "emily.w@email.com",
    phone: "(555) 456-7890",
    childAge: "6 months",
    preferredStart: "May 2026",
    message: "I'm looking for infant care 3 days a week. What are your rates for part-time care? I'm particularly interested in your staff-to-child ratio for infants and your approach to sleep schedules.",
    date: "Yesterday",
    status: "contacted"
  },
  {
    id: 4,
    parentName: "David Martinez",
    email: "david.m@email.com",
    phone: "(555) 567-8901",
    childAge: "3 years",
    preferredStart: "March 2026",
    message: "Do you offer Montessori curriculum? We're very interested in that approach for our son. Would love to schedule a tour to see your facilities.",
    date: "Mar 8, 2026",
    status: "contacted"
  },
  {
    id: 5,
    parentName: "Jessica Brown",
    email: "jess.brown@email.com",
    phone: "(555) 678-9012",
    childAge: "18 months",
    preferredStart: "Flexible",
    message: "What is your staff-to-child ratio for toddlers? Also, do you provide meals and snacks, or do we need to pack lunch? Looking for care 4 days a week.",
    date: "Mar 7, 2026",
    status: "replied"
  },
]

function InquiryCard({ inquiry, isSelected, onClick }: { 
  inquiry: typeof inquiries[0]
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 border-b border-border cursor-pointer transition-colors",
        isSelected ? "bg-primary/5" : "hover:bg-muted/50",
        inquiry.status === "new" && "border-l-4 border-l-primary"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-medium text-foreground">{inquiry.parentName}</div>
        <Badge 
          variant={inquiry.status === "new" ? "default" : inquiry.status === "contacted" ? "secondary" : "outline"}
          className={inquiry.status === "new" ? "bg-primary" : ""}
        >
          {inquiry.status === "new" ? "New" : inquiry.status === "contacted" ? "Contacted" : "Replied"}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{inquiry.message}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Baby className="h-3 w-3" />
          {inquiry.childAge}
        </span>
        <span>{inquiry.date}</span>
      </div>
    </div>
  )
}

function InquiryDetail({ inquiry }: { inquiry: typeof inquiries[0] }) {
  const [reply, setReply] = useState("")

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{inquiry.parentName}</h2>
            <p className="text-sm text-muted-foreground">{inquiry.date}</p>
          </div>
          <Badge 
            variant={inquiry.status === "new" ? "default" : inquiry.status === "contacted" ? "secondary" : "outline"}
            className={inquiry.status === "new" ? "bg-primary" : ""}
          >
            {inquiry.status === "new" ? "New" : inquiry.status === "contacted" ? "Contacted" : "Replied"}
          </Badge>
        </div>

        {/* Contact info */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${inquiry.email}`} className="text-primary hover:underline">{inquiry.email}</a>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${inquiry.phone}`} className="text-primary hover:underline">{inquiry.phone}</a>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            Child Age: {inquiry.childAge}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Preferred Start: {inquiry.preferredStart}
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="flex-1 p-6 overflow-auto">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Message</h3>
        <p className="text-foreground leading-relaxed">{inquiry.message}</p>
      </div>

      {/* Reply area */}
      <div className="p-6 border-t border-border bg-muted/30">
        <Textarea 
          placeholder="Write your reply..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          className="mb-3"
        />
        <div className="flex gap-2">
          <Button disabled={!reply.trim()}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Reply
          </Button>
          <Button variant="outline">
            <Check className="h-4 w-4 mr-2" />
            Mark as Contacted
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function InquiriesPage() {
  const [selectedId, setSelectedId] = useState(inquiries[0].id)
  const selectedInquiry = inquiries.find(i => i.id === selectedId)!

  const newCount = inquiries.filter(i => i.status === "new").length
  const contactedCount = inquiries.filter(i => i.status === "contacted").length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inquiries</h1>
        <p className="text-muted-foreground">Manage parent inquiries and messages</p>
      </div>

      {/* Inbox layout */}
      <Card className="border-border/50 overflow-hidden">
        <div className="grid lg:grid-cols-[350px_1fr] min-h-[600px]">
          {/* Inbox list */}
          <div className="border-r border-border flex flex-col">
            <Tabs defaultValue="all" className="w-full">
              <div className="p-3 border-b border-border">
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">All ({inquiries.length})</TabsTrigger>
                  <TabsTrigger value="new" className="flex-1">New ({newCount})</TabsTrigger>
                  <TabsTrigger value="contacted" className="flex-1">Contacted ({contactedCount})</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="m-0 overflow-auto">
                {inquiries.map((inquiry) => (
                  <InquiryCard 
                    key={inquiry.id} 
                    inquiry={inquiry} 
                    isSelected={selectedId === inquiry.id}
                    onClick={() => setSelectedId(inquiry.id)}
                  />
                ))}
              </TabsContent>

              <TabsContent value="new" className="m-0 overflow-auto">
                {inquiries.filter(i => i.status === "new").map((inquiry) => (
                  <InquiryCard 
                    key={inquiry.id} 
                    inquiry={inquiry} 
                    isSelected={selectedId === inquiry.id}
                    onClick={() => setSelectedId(inquiry.id)}
                  />
                ))}
              </TabsContent>

              <TabsContent value="contacted" className="m-0 overflow-auto">
                {inquiries.filter(i => i.status === "contacted").map((inquiry) => (
                  <InquiryCard 
                    key={inquiry.id} 
                    inquiry={inquiry} 
                    isSelected={selectedId === inquiry.id}
                    onClick={() => setSelectedId(inquiry.id)}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Detail view */}
          <div className="hidden lg:block">
            <InquiryDetail inquiry={selectedInquiry} />
          </div>
        </div>
      </Card>

      {/* Mobile detail view */}
      <Card className="lg:hidden border-border/50">
        <InquiryDetail inquiry={selectedInquiry} />
      </Card>
    </div>
  )
}
