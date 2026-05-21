<script setup lang="ts">
import { computed, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { verifyCertificate } from '@/services/certificates'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/constants/enums'

function goApply() {
  uni.navigateTo({ url: '/subpackages/approvals/form' })
}

function goRecords() {
  uni.navigateTo({ url: '/subpackages/certificates/records' })
}

function goTemplateAdmin() {
  uni.navigateTo({
    url: '/subpackages/certificates/admin/templates',
    fail: () => {
      uni.showToast({ title: '页面不存在，请刷新重试', icon: 'none' })
    },
  })
}

const userStore = useUserStore()
const canManage = computed(() => Number(userStore.userInfo?.role || 0) >= UserRole.TEACHER)

const verifyCode = ref('')
const verifying = ref(false)
const verifyMessage = ref('')

async function submitVerify() {
  const code = verifyCode.value.trim()
  if (!code) {
    uni.showToast({ title: '请输入核验码', icon: 'none' })
    return
  }

  verifying.value = true
  verifyMessage.value = ''
  try {
    const res = await verifyCertificate(code)
    if (res.valid && res.certificate?.id) {
      verifyMessage.value = '核验通过，正在打开详情'
      uni.navigateTo({ url: `/subpackages/certificates/detail?id=${res.certificate.id}` })
      return
    }
    verifyMessage.value = res.message || '核验未通过'
  } catch (e) {
    verifyMessage.value = e instanceof Error ? e.message : '核验失败'
  } finally {
    verifying.value = false
  }
}
</script>

<template>
  <layout-shell current="certificates">
    <view class="page-container certificates-page">
      <content-panel title="电子证件" sub-title="证件随审批流程自动生成，支持查询、下载与核验">
        <template #default>
          <view class="action-row">
            <nut-button type="primary" @click="goApply">去发起审批</nut-button>
            <nut-button plain @click="goRecords">查看我的证件</nut-button>
            <nut-button v-if="canManage" plain @click="goTemplateAdmin">模板管理</nut-button>
          </view>
        </template>
      </content-panel>

      <content-panel title="生成规则">
        <template #default>
          <nut-cell title="审批类型" desc="当前支持 leave（请假）与 budget（预算）两类审批" icon="tips" />
          <nut-cell title="申请材料" desc="学生提交审批后自动生成 application 阶段材料" icon="tips" />
          <nut-cell title="审批凭证" desc="管理员审批通过后自动生成 approval_certificate 阶段凭证" icon="tips" />
        </template>
      </content-panel>

      <content-panel title="证件核验">
        <template #default>
          <nut-input v-model="verifyCode" placeholder="请输入证件核验码" />
          <view class="verify-row">
            <nut-button type="primary" :loading="verifying" @click="submitVerify">立即核验</nut-button>
          </view>
          <text v-if="verifyMessage" class="verify-message">{{ verifyMessage }}</text>
        </template>
      </content-panel>

      <content-panel title="说明">
        <template #default>
          <text class="intro">如果你只想获取材料/凭证，请直接提交审批，系统会自动生成对应证件记录。</text>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.certificates-page {
  min-height: 100vh;
}

.action-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.verify-row {
  margin-top: var(--space-2);
}

.verify-message {
  display: block;
  margin-top: var(--space-2);
  color: var(--color-text-secondary);
}

.intro {
  display: block;
  color: var(--color-text-secondary);
  line-height: 1.7;
}
</style>
