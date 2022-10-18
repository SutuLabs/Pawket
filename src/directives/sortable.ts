import Sortable from "sortablejs";
import { DirectiveBinding } from "vue/types/options";

const createSortable = (el: HTMLElement, options: Sortable.Options) => {
  return Sortable.create(el, {
    ...options,
    onEnd: function (evt) {
      if (!evt || evt.newIndex === undefined || evt.oldIndex === undefined) return;
      const updateOrder = new CustomEvent("updateOrder", { detail: { oldIndex: evt.oldIndex, newIndex: evt.newIndex } });
      el.dispatchEvent(updateOrder);
    },
  });
};

interface SortableHTMLElement extends HTMLElement {
  _sortable: Sortable;
}

/**
 * We add a new instance of Sortable when the element
 * is bound or updated, and destroy it when it's unbound.
 */
const sortable = {
  name: "sortable",
  bind(el: HTMLElement, binding: DirectiveBinding): void {
    const container = el as SortableHTMLElement;
    if (!container) return;
    container._sortable = createSortable(container, binding.value);
  },
  update(el: HTMLElement, binding: DirectiveBinding): void {
    const container = el as SortableHTMLElement;
    const sortable = container?._sortable;
    if (!sortable) return;
    sortable.destroy();
    container._sortable = createSortable(container, binding.value);
  },
  unbind(el: HTMLElement): void {
    const container = el as SortableHTMLElement;
    const sortable = container?._sortable;
    if (!sortable) return;
    sortable.destroy();
  },
};

export { sortable };
