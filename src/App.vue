<template>
  <div id="app">
    <!-- <b-navbar type="is-light">
      <template #brand>
        <b-navbar-item tag="router-link" :to="{ path: '/' }" :exact="true">Wallet</b-navbar-item>
      </template>
      <template #start>
        <b-navbar-item tag="router-link" :to="{ path: '/about' }">About</b-navbar-item>
      </template>
      <template #end>
        <profile-corner :login-info="loginInfo"></profile-corner>
      </template>
    </b-navbar>
    <div class="container"> -->
    <router-view />
    <!-- </div> -->
  </div>
</template>

<style lang="scss"></style>
