<template>
  <div class="login">
    <div class="brand">
      <h1>CityNote</h1>
      <p>密码登录（演示）</p>
    </div>

    <div class="cn-card form">
      <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" size="large">
        <template #prefix><el-icon><Iphone /></el-icon></template>
      </el-input>
      <el-input
        v-model="form.code"
        placeholder="请输入验证码"
        maxlength="6"
        size="large"
        class="mt"
      >
        <template #prefix><el-icon><Message /></el-icon></template>
      </el-input>
      <el-input
        v-model="form.password"
        type="password"
        placeholder="请输入密码"
        show-password
        size="large"
        class="mt"
      >
        <template #prefix><el-icon><Lock /></el-icon></template>
      </el-input>
      <el-button
        class="code-link"
        link
        type="primary"
        :disabled="countdown > 0"
        @click="handleSendCode"
      >
        {{ countdown > 0 ? `重新发送 ${countdown}s` : '获取验证码' }}
      </el-button>
      <el-alert
        class="notice"
        title="后端暂未实现密码校验，此页仅演示表单，登录仍需验证码"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-button type="primary" size="large" class="submit" @click="handleLogin">登录</el-button>
      <div class="links">
        <router-link to="/login">验证码登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Iphone, Message, Lock } from '@element-plus/icons-vue'
import { sendCode, login } from '@/api/user'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const form = ref({ phone: '', code: '', password: '' })
const countdown = ref(0)
const phoneReg = /^1[3456789]\d{9}$/

async function handleSendCode() {
  if (!phoneReg.test(form.value.phone)) {
    ElMessage.error('手机号格式错误')
    return
  }
  await sendCode(form.value.phone)
  ElMessage.success('验证码已发送，请查看后端控制台日志')
  countdown.value = 60
  const timer = setInterval(() => {
    if (--countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function handleLogin() {
  if (!form.value.phone || !form.value.code) {
    ElMessage.error('手机号和验证码不能为空')
    return
  }
  const res = await login({ ...form.value })
  store.setToken(res.data)
  await store.fetchMe(true).catch(() => {})
  router.replace(route.query.redirect || '/')
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
}
.brand p {
  margin-top: var(--cn-space-2);
  color: var(--cn-text-2);
  font-size: 14px;
}
.form {
  padding: var(--cn-space-5) var(--cn-space-4);
}
.mt {
  margin-top: var(--cn-space-3);
}
.code-link {
  margin-top: var(--cn-space-2);
}
.notice {
  margin: var(--cn-space-3) 0;
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
