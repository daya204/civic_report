"use client"

import type { Complaint } from "@/lib/types"

interface ComplaintMapProps {
  complaint: Pick<Complaint, "latitude" | "longitude" | "location">
}

export function ComplaintMap({ complaint }: ComplaintMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return null
  }

  const { latitude, longitude, location } = complaint

  const src = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${latitude},${longitude}&zoom=16&maptype=roadmap`

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/30">
      <iframe
        title={`Map view for ${location}`}
        src={src}
        width="100%"
        height="280"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}

