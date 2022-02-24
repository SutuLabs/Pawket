<template>
  <div class="about">
    <div class="container p-6">
      <div class="columns">
        <div class="column">
          <h1 class="is-size-3">{{ $t('about.ui.title.roadmap')}}</h1>
          <blockquote>{{ $t('about.ui.blackquote.slogan')}}</blockquote>
          <ul class="py-3">
            <li class="done">{{ $t('about.ui.list.1')}}</li>
            <li class="done">{{ $t('about.ui.list.2')}}</li>
            <li class="done">{{ $t('about.ui.list.3')}}</li>
            <li class="done">{{ $t('about.ui.list.4')}}</li>
            <li class="done">{{ $t('about.ui.list.5')}}</li>
            <li class="done">{{ $t('about.ui.list.6')}}</li>
            <li class="done">{{ $t('about.ui.list.7')}}</li>
            <li class="done">{{ $t('about.ui.list.8')}}</li>
            <li class="done">{{ $t('about.ui.list.9')}}</li>
            <li class="done">{{ $t('about.ui.list.10')}}</li>
            <li class="done">{{ $t('about.ui.list.11')}}</li>
            <li class="done">{{ $t('about.ui.list.12')}}</li>
          </ul>
          <ul class="py-3">
            <li class="plan">{{ $t('about.ui.list.13')}}</li>
            <li class="plan">{{ $t('about.ui.list.14')}}</li>
            <li class="plan">{{ $t('about.ui.list.15')}}</li>
            <li class="plan">{{ $t('about.ui.list.16')}}</li>
            <li class="plan">{{ $t('about.ui.list.17')}}</li>
            <li class="plan">{{ $t('about.ui.list.18')}}</li>
            <li class="plan">{{ $t('about.ui.list.19')}}</li>
            <li class="plan">{{ $t('about.ui.list.20')}}</li>
            <li class="plan">{{ $t('about.ui.list.21')}}</li>
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
