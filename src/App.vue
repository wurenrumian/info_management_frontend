<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import 'nutui-uniapp/styles/index.scss';
@import './styles/index.scss';

page {
  background-color: var(--color-bg);
}

:root,
page {
  --nut-primary-color: var(--color-primary);
  --nut-primary-color-end: var(--color-primary);
  --nut-required-color: var(--color-primary);
  --nut-title-color: var(--color-text);
  --nut-title-color2: var(--color-text-secondary);
  --nut-text-color: var(--color-text-secondary);
  --nut-help-color: #f5f1ec;
  --nut-cell-background: var(--color-surface);
  --nut-cell-box-shadow: none;
  --nut-cell-after-border-bottom: 1px solid var(--color-border);
  --nut-input-border-bottom: var(--color-border);
  --nut-picker-ok-color: var(--color-primary);
  --nut-picker-cancel-color: var(--color-text-secondary);
  --nut-button-primary-background-color: linear-gradient(135deg, #b21f2d 0%, #b21f2d 100%);
  --nut-button-primary-border-color: #b21f2d;
  --nut-button-info-background-color: linear-gradient(135deg, #4281a4 0%, #4281a4 100%);
  --nut-button-info-border-color: #4281a4;
  --nut-button-success-background-color: linear-gradient(135deg, #48a9a6 0%, #48a9a6 100%);
  --nut-button-success-border-color: #48a9a6;
  --nut-button-warning-background-color: linear-gradient(135deg, #d4b483 0%, #d4b483 100%);
  --nut-button-warning-border-color: #d4b483;
  --nut-button-danger-background-color: #b21f2d;
  --nut-button-danger-border-color: #b21f2d;
}
</style>
