<script setup lang="ts">
import type { NotifyListItem } from '../../api/messageApi'
import GoTopAndRefresh from '../../components/GoTopAndRefresh.vue'
import NotifyCard, { type NotifyCardData } from '../../components/NotifyCard.vue'
import PullRefresh from '../../components/PullRefresh.vue'
import { useNotifyList } from '../../composables/useNotifyList'

function mapItem(e: NotifyListItem): NotifyCardData {
  return {
    id: e.id,
    user: e.user,
    info: e.notify_params?.reply_text,
    content: e.notify_params?.text,
    time: e.created_at,
    resource_id: e.content_id,
    resource_type: e.content_type,
  }
}

const { list, refresh, showMore } = useNotifyList(2, mapItem)
</script>

<template>
  <!-- 参考 CommentMention -->
  <div class="scrollbar">
    <PullRefresh @download="showMore" @refresh="refresh">
      <NotifyCard v-for="(item, i) in list" :key="item.id ?? i" :data="item" />
    </PullRefresh>
    <GoTopAndRefresh @refresh="refresh" />
  </div>
</template>

<style scoped>
.scrollbar {
  height: 100%;
  overflow-y: auto;
}
</style>
