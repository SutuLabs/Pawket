<template>
  <div class="about">
    <div class="container p-6">
      <div class="columns">
        <div class="column">
          <h1 class="is-size-3">Roadmap</h1>
          <blockquote>Manage your CATs in Pawket!</blockquote>
          <ul class="py-3">
            <li class="done">Fully support offline scenario</li>
            <li class="done">View XCH/CATs balance</li>
            <li class="done">Receive XCH/CATs in online/offline mode</li>
            <li class="done">Init wallet by freely 12/24 words mnemonic</li>
            <li class="done">Generated compatible mnemonic which could be used directly in Chia&trade; client</li>
            <li class="done">Show fingerprint which fully compatible with Chia&trade; client</li>
            <li class="done">Infinite derivative wallet</li>
            <li class="done">Shadow wallet(password protected mnemonic)</li>
            <li class="done">Address variation(derivative addresses) for XCH/CATs</li>
            <li class="done">Import and manage custom CAT</li>
          </ul>
          <ul class="py-3">
            <li class="plan">Package as extension and provide API for dApps</li>
            <li class="plan">Package as the app and provide download through AppStore and Google Play</li>
            <li class="plan">Support view only wallet</li>
            <li class="plan">Support offer creation/consumption</li>
            <li class="plan">Support view NFT</li>
            <li class="plan">Support send NFT</li>
            <li class="plan">Support NFT creation</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
li.done:before {
  content: "✅ ";
}
li.plan:before {
  content: "🔲 ";
}
blockquote {
  background: #f9f9f9;
  border-left: 10px solid #39c0ae;
  margin: 1.5em 10px;
  padding: 0.5em 10px;
  quotes: "\201C""\201D""\2018""\2019";
  font-weight: bold;
}
blockquote:before {
  color: #39c0ae;
  content: open-quote;
  font-size: 4em;
  line-height: 0.1em;
  margin-right: 0.25em;
  vertical-align: -0.4em;
}
blockquote p {
  display: inline;
}
</style>
