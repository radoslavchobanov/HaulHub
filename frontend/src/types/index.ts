export interface HaulerProfile {
  bio: string
  skills: string[]
  profile_photo: string | null
  rating_avg: string
  review_count: number
  no_show_count: number
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  phone_verified: boolean
  user_type: 'client' | 'hauler'
  auth_provider: 'email' | 'google'
  country: string
  city: string
  account_status: 'active' | 'warned' | 'suspended' | 'banned'
  verification_tier: 'unverified' | 'phone_verified' | 'id_verified'
  cancellation_rate: number | null
  created_at: string
  hauler_profile?: HaulerProfile | null
}

export interface JobApplication {
  id: string
  job: Job
  hauler: User
  proposal_message: string
  status: 'pending' | 'negotiating' | 'accepted' | 'rejected'
  chat_room_id: string | null
  created_at: string
}

export interface Job {
  id: string
  client: User
  title: string
  description: string
  category: string
  category_display: string
  budget: string
  country: string
  city: string
  neighborhood: string
  location_display: string
  scheduled_date: string
  status: 'open' | 'assigned' | 'in_progress' | 'pending_completion' | 'completed' | 'cancelled'
  status_display: string
  application_count: number
  my_application: JobApplication | null
  booking?: { id: string }
  created_at: string
  updated_at: string
}

export interface JobEvidence {
  id: string
  evidence_type: 'pickup' | 'dropoff'
  photo: string
  lat: string | null
  lng: string | null
  captured_at: string
}

export interface JobAmendment {
  id: string
  proposed_budget: string
  reason: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export interface Booking {
  id: string
  job: Job
  client: User
  hauler: User
  amount: string
  status: 'assigned' | 'in_progress' | 'pending_completion' | 'completed' | 'disputed' | 'resolved_hauler' | 'resolved_client' | 'cancelled'
  pickup_pin: string | null
  escrow_locked_at: string
  pickup_confirmed_at: string | null
  hauler_marked_done_at: string | null
  dispute_opened_at: string | null
  auto_release_at: string | null
  completed_at: string | null
  created_at: string
  evidence: JobEvidence[]
  chat_room_id: string | null
  hours_until_auto_release: number | null
  can_review: boolean
}

export interface Message {
  id: string
  chat_room: string
  sender: User
  sender_id?: string
  sender_name?: string
  content: string
  sent_at: string
  is_read: boolean
}

export interface ChatRoomBookingInfo {
  id: string | null
  job_title: string
  status: string
  other_party: User | null
  application_id: string | null
}

export interface ChatRoom {
  id: string
  booking_info: ChatRoomBookingInfo
  last_message: Message | null
  unread_count: number
  created_at: string
}

export interface Transaction {
  id: string
  transaction_type: 'deposit' | 'escrow_lock' | 'escrow_release' | 'withdrawal' | 'reserve_hold' | 'reserve_release'
  transaction_type_display: string
  amount: string
  description: string
  created_at: string
}

export interface Wallet {
  available_balance: string
  escrow_balance: string
  reserve_balance: string
  pending_balance: number
  total_balance: number
  transactions: Transaction[]
}

export interface Review {
  id: string
  booking: string
  reviewer: User
  reviewee: User
  rating: number
  comment: string
  created_at: string
}

export interface AuthTokens {
  access: string
  refresh: string
}
