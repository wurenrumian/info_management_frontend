import type { SubscribeTemplateConfig } from '@/types/notification'

export const SUBSCRIBE_TEMPLATES: SubscribeTemplateConfig[] = [
  {
    template_code: 'time_reminder',
    wechat_template_id: 'zk-fz3D2ggWyttyPFQm3UReRiHkxu_0Hn0cOCx3nijk',
    name: '活动执行时间提醒',
    description: '用于活动进度与截止时间提醒',
  },
  {
    template_code: 'approval_result',
    wechat_template_id: 'M626iRqFxkQwDX81ASfDsZzCHUjs0MQAjPpKWDMUAig',
    name: '审批结果通知',
    description: '用于推送审批进度与审批结论',
  },
  {
    template_code: 'login_sucessful',
    wechat_template_id: 'tDO0vkDRDxFHbgIYcuS8U9BY_cAMylqyJlj8Q0HeQpw',
    name: '登录成功通知',
    description: '用于提醒账号登录行为',
  },
]
