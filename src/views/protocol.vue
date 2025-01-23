<template></template>

<script setup lang="ts">
import { articleDetails } from "api/account/index";
import axios from "axios";
import { useRoute } from "vue-router";

const route = useRoute();

const columnCode = route.query.columnCode as string;
if (columnCode) {
  articleDetails({ columnCode, articleCode: "" }).then((res) => {
    const url = res.data.url;
    axios({ url }).then((res) => {
      window.document.write(res.data);
      window.document.close();
    });
  });
}
</script>

<style lang="scss" scoped></style>
