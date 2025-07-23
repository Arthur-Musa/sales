import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface WhatsAppConversation {
  id: string
  client_id?: string
  lead_id?: string
  phone: string
  status: string
  ai_active: boolean
  ai_confidence: number
  last_message_at: string
  created_at: string
  clients?: any
  leads?: any
}

interface WhatsAppMessage {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  type: string
  content?: string
  template_name?: string
  timestamp: string
  delivered: boolean
  read: boolean
  failed: boolean
  created_at: string
}

export function useWhatsApp() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConversations()
    
    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('whatsapp_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'whatsapp_messages'
        }, 
        (payload) => {
          const newMessage = payload.new as WhatsAppMessage
          if (selectedConversation === newMessage.conversation_id) {
            setMessages(prev => [...prev, newMessage])
          }
          
          // Update conversation last message time
          setConversations(prev => 
            prev.map(conv => 
              conv.id === newMessage.conversation_id
                ? { ...conv, last_message_at: newMessage.created_at }
                : conv
            )
          )
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          clients(*),
          leads(*)
        `)
        .order('last_message_at', { ascending: false })

      if (fetchError) throw fetchError
      setConversations(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conversas')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })

      if (fetchError) throw fetchError
      setMessages(data || [])
      setSelectedConversation(conversationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens')
    }
  }

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      // Find conversation phone
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) throw new Error('Conversa não encontrada')

      // Send via WhatsApp API (this would typically be done via edge function)
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phone: conversation.phone,
          message: content
        }
      })

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem')
      throw err
    }
  }

  const toggleAI = async (conversationId: string, aiActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .update({ ai_active: aiActive })
        .eq('id', conversationId)
        .select()
        .single()

      if (error) throw error
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, ai_active: aiActive }
            : conv
        )
      )
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar IA')
      throw err
    }
  }

  const assignToUser = async (conversationId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .update({ assigned_to: userId })
        .eq('id', conversationId)
        .select()
        .single()

      if (error) throw error
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, assigned_to: userId }
            : conv
        )
      )
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atribuir conversa')
      throw err
    }
  }

  return {
    conversations,
    selectedConversation,
    messages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    toggleAI,
    assignToUser
  }
}