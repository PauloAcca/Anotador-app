import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CollectionsClient } from '@/components/collections/collections-client'
import type { Collection, CollectionItem } from '@/types/database'
import type { CollectionView } from '@/types'

export const metadata: Metadata = { title: 'Listas' }

export default async function CollectionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const uid = user!.id

  const [{ data: collections }, { data: items }] = await Promise.all([
    supabase
      .from('anotador_collections')
      .select('*')
      .eq('user_id', uid)
      .eq('archived', false)
      .order('created_at'),
    supabase
      .from('anotador_collection_items')
      .select('*')
      .eq('user_id', uid)
      .order('position'),
  ])

  const realItems = (items ?? []) as CollectionItem[]
  const views: CollectionView[] = ((collections ?? []) as Collection[]).map(
    (collection) => ({
      collection,
      items: realItems.filter((item) => item.collection_id === collection.id),
    })
  )

  return <CollectionsClient collections={views} />
}
