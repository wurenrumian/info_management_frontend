<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LayoutShell from '@/components/layout-shell.vue'
import { changePassword } from '@/services/auth'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

function validatePassword(value: string) {
  const text = value.trim()
  return text.length >= 6
}

async function submitChangePassword() {
  const current = currentPassword.value.trim()
  const next = newPassword.value.trim()
  const confirm = confirmPassword.value.trim()

  if (!current || !next || !confirm) {
    uni.showToast({ title: '请填写完整密码信息', icon: 'none' })
    return
  }
  if (!validatePassword(next)) {
    uni.showToast({ title: '新密码至少6位', icon: 'none' })
    return
  }
  if (next !== confirm) {
    uni.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
    return
  }
  if (current === next) {
    uni.showToast({ title: '新密码不能与旧密码相同', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await changePassword({
      current_password: current,
      new_password: next,
    })
    uni.showToast({ title: '密码修改成功', icon: 'success' })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => {
      uni.navigateBack({
        fail: () => {
          uni.reLaunch({ url: '/pages/profile/index' })
        },
      })
    }, 300)
  } catch (e) {
    const message = e instanceof Error ? e.message : '修改密码失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  // no-op
})
</script>

<template>
  <layout-shell current="profile">
    <view class="page-container change-password-page">
      <content-panel title="修改密码" sub-title="登录后可在此更新账号密码">
        <template #default>
          <view class="field">
            <text class="label">当前密码</text>
            <nut-input v-model="currentPassword" type="password" placeholder="请输入当前密码" />
          </view>
          <view class="field">
            <text class="label">新密码</text>
            <nut-input v-model="newPassword" type="password" placeholder="至少6位" />
          </view>
          <view class="field">
            <text class="label">确认新密码</text>
            <nut-input v-model="confirmPassword" type="password" placeholder="再次输入新密码" />
          </view>

          <nut-button type="primary" block :loading="submitting" @click="submitChangePassword">保存新密码</nut-button>
        </template>
      </content-panel>
    </view>
  </layout-shell>
</template>

<style scoped lang="scss">
.change-password-page {
  min-height: 100vh;
}

.field + .field {
  margin-top: var(--space-3);
}

.label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--color-text-secondary);
}
</style>
