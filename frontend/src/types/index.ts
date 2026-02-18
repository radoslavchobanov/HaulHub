export interface HaulerProfile {
  bio: string
  skills: string[]
  profile_photo: string | null
  rating_avg: string
  review_count: number
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  user_type: 'client' | 'hauler'
  auth_provider: 'email' | 'google'
  created_at: string
  hauler_profile?: HaulerProfile
}

export interface JobApplication {
  id: string
  job: Job
  hauler: User
  proposal_message: string
  status: 'pending' | 'accepted' | 'rejected'
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
  location_address: string
  scheduled_date: string
  status: 'open' | 'assigned' | 'completed' | 'cancelled'
  status_display: string
  application_count: number
  my_application: JobApplication | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  job: Job
  client: User
  hauler: User
  amount: string
  status: 'active' | 'completed' | 'cancelled'
  escrow_locked_at: string
  auto_release_at: string
  completed_at: string | null
  created_at: string
  chat_room_id: string | null
  days_until_auto_release: number | null
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
  id: string
  job_title: string
  status: string
  other_party: User | null
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
  transaction_type: 'deposit' | 'escrow_lock' | 'escrow_release' | 'withdrawal'
  transaction_type_display: string
  amount: string
  description: string
  created_at: string
}

export interface Wallet {
  available_balance: string
  escrow_balance: string
  total_balance: string
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
