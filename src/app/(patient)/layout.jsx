import AiBookingAssistant from "@/components/patient/AiBookingAssistant"

export default function PatientLayout({ children }) {
  return (
    <>
      <AiBookingAssistant />
      {children}
    </>
  )
}