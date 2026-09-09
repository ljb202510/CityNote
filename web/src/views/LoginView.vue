<template>
  <div class="login">
    <div class="brand">
      <h1>CityNote</h1>
      <p>记录你的城市好去处</p>
    </div>

    <div class="cn-card form">
      <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" size="large">
        <template #prefix><el-icon><Iphone /></el-icon></template>
      </el-input>
      <div class="code-row">
        <el-input v-model="form.code" placeholder="请输入验证码" maxlength="6" size="large">
          <template #prefix><el-icon><Message /></el-icon></template>
        </el-input>
        <el-button
          class="code-btn"
          size="large"
          :disabled="countdown > 0"
          @click="handleSendCode"
        >
          {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
        </el-button>
      </div>
      <p class="tip">未注册的手机号验证后自动创建账号</p>
      <el-button type="primary" size="large" class="submit" @click="handleLogin">登录</el-button>
      <div class="links">
        <router-link to="/login/password">密码登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Iphone, Message } from '@element-plus/icons-vue'
import { sendCode, login } from '@/api/user'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const form = ref({ phone: '', code: '' })
const countdown = ref(0)

const phoneReg = /^1[3456789]\d{9}$/

async function handleSendCode() {
  if (!phoneReg.test(form.value.phone)) {
    ElMessage.error('手机号格式错误')
    return
  }
  try {
    await sendCode(form.value.phone)
    ElMessage.success('验证码已发送，请查看后端控制台日志')
    countdown.value = 60
    const timer = setInterval(() => {
      if (--countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (e) {
    // 拦截器已提示
  }
}

async function handleLogin() {
  if (!form.value.phone || !form.value.code) {
    ElMessage.error('手机号和验证码不能为空')
    return
  }
  try {
    const res = await login({ phone: form.value.phone, code: form.value.code })
    store.setToken(res.data)
    await store.fetchMe(true).catch(() => {})
    router.replace(route.query.redirect || '/')
  } catch (e) {
    // 拦截器已提示
  }
}
</script>

<style scoped>
.login {
  min-height: 100dvh;
  padding: var(--cn-space-6) var(--cn-space-4);
  background: linear-gradient(180deg, var(--cn-primary-light) 0%, var(--cn-bg) 40%);
}
.brand {
  padding: var(--cn-space-6) 0 var(--cn-space-5);
}
.brand h1 {
  color: var(--cn-primary);
  font-size: 30px;
  letter-spacing: 1px;
}
.brand p {
  margin-top: var(--cn-space-2);
  color: var(--cn-text-2);
  font-size: 14px;
}
.form {
  padding: var(--cn-space-5) var(--cn-space-4);
}
.code-row {
  display: flex;
  gap: var(--cn-space-2);
  margin-top: var(--cn-space-3);
}
.code-btn {
  flex-shrink: 0;
}
.tip {
  margin: var(--cn-space-3) 0;
  font-size: 12px;
  color: var(--cn-text-3);
  text-align: center;
}
.submit {
  width: 100%;
}
.links {
  margin-top: var(--cn-space-3);
  text-align: right;
  font-size: 13px;
  color: var(--cn-primary);
}
</style>
