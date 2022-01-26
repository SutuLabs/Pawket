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
    <div class="container">-->
    <router-view />
    <!-- </div> -->
    <footer class="footer">
      <div class="content has-text-centered">
        <p>
          <strong>Chiabee Wallet</strong> by
          <a href="https://www.chiabee.net">Chiabee</a>. The  
          <a href="http://github.com/chiabee">source code</a> would available later.
          This app is in Alpha stage, don't use in Production.
        </p>
      </div>
    </footer>
  </div>
</template>

<style lang="scss"></style>
