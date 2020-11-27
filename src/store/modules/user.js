/**
 * @copyright chuzhixin 1204505056@qq.com
 * @description 登录、获取用户信息、退出登录、清除accessToken逻辑，不建议修改
 */

import Vue from 'vue';
import { getInfo, login, logout } from '@/api/user';
import { getAccessToken, getAccessCsrf, removeAccessToken, setAccessToken } from '@/utils/accessToken';
import { resetRouter } from '@/router';
import { title, tokenName } from '@/config/settings';

const state = {
  accessToken: getAccessToken(),
  accessCsrf: getAccessCsrf(),
  username: '',
  avatar: '',
  permissions: [],
  userInfo: {},
};
const getters = {
  accessToken: state => state.accessToken,
  accessCsrf: state => state.accessCsrf,
  username: state => state.username,
  avatar: state => state.avatar,
  permissions: state => state.permissions,
  userInfo: state => state.userInfo,
};
const mutations = {
  setAccessToken(state, accessToken) {
    state.accessToken = JSON.parse(accessToken).jwt;
    state.accessCsrf = JSON.parse(accessToken).csrf;
    setAccessToken(accessToken);
  },
  setusername(state, username) {
    state.username = username;
  },
  setAvatar(state, avatar) {
    state.avatar = avatar;
  },
  setPermissions(state, permissions) {
    state.permissions = permissions;
  },
  setUserInfo(state, userInfo) {
    state.userInfo = userInfo;
  },
};
const actions = {
  setPermissions({ commit }, permissions) {
    commit('setPermissions', permissions);
  },
  async login({ commit }, userInfo) {
    const { code, data, msg } = await login(userInfo);
    if (code !== 0) {
      Vue.prototype.$baseMessage(msg, 'error');
      return;
    }
    const accessToken = data.token;
    const csrf = data.csrf;
    if (accessToken) {
      commit('setAccessToken', JSON.stringify({ jwt: `Bearer ${ accessToken }`, csrf }));
      const hour = new Date().getHours();
      const thisTime =
        hour < 8 ? '早上好' : hour <= 11 ? '上午好' : hour <= 13 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
      Vue.prototype.$baseNotify(`欢迎登录${ title }`, `${ thisTime }！`);
    } else {
      Vue.prototype.$baseMessage(`登录接口异常，未正确返回${ tokenName }...`, 'error');
    }
  },
  async getInfo({ commit, state }) {
    const { data } = await getInfo();
    if (!data) {
      Vue.prototype.$baseMessage('验证失败，请重新登录...', 'error');
      return false;
    }
    let { permissions, username, avatar } = data;
    if (permissions && username) {
      commit('setPermissions', permissions);
      commit('setusername', username);
      commit('setAvatar', avatar);
      commit('setUserInfo', data);
      return permissions;
    } else {
      Vue.prototype.$baseMessage('获取用户信息接口异常', 'error');
      return false;
    }
  },
  async logout({ dispatch }) {
    await logout(state.accessToken);
    await dispatch('tagsBar/delAllRoutes', null, { root: true });
    await dispatch('resetAccessToken');
    await resetRouter();
  },
  resetAccessToken({ commit }) {
    commit('setPermissions', []);
    commit('setAccessToken', JSON.stringify({}));
    removeAccessToken();
  },
};
export default { state, getters, mutations, actions };