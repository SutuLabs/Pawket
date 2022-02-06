import Sortable from 'sortablejs'
import { VNode } from 'vue';
import { DirectiveBinding } from 'vue/types/options';

const createSortable = (el: HTMLElement, options: Sortable.Options, vnode: VNode) => {
    return Sortable.create(el, {
        ...options,
        onEnd: function (evt) {
            if (!evt || !evt.newIndex || !evt.oldIndex) return;
            if (!vnode?.componentInstance) return;
            const data = vnode.componentInstance.$data.tags
            const item = data[evt.oldIndex]
            if (evt.newIndex > evt.oldIndex) {
                for (let i = evt.oldIndex; i < evt.newIndex; i++) {
                    data[i] = data[i + 1]
                }
            } else {
                for (let i = evt.oldIndex; i > evt.newIndex; i--) {
                    data[i] = data[i - 1]
                }
            }
            data[evt.newIndex] = item
            vnode.componentInstance.$emit('input', data)
        }
    })
}

interface SortableHTMLElement extends HTMLElement {
    _sortable: Sortable;
}

/**
 * We add a new instance of Sortable when the element
 * is bound or updated, and destroy it when it's unbound.
 */
const sortable = {
    name: 'sortable',
    bind(el: HTMLElement, binding: DirectiveBinding, vnode: VNode): void {
        const container = el.querySelector('.taginput-container') as SortableHTMLElement;
        if (!container) return;
        container._sortable = createSortable(container, binding.value, vnode);
    },
    update(el: HTMLElement, binding: DirectiveBinding, vnode: VNode): void {
        const container = el.querySelector('.taginput-container') as SortableHTMLElement;
        const sortable = container?._sortable;
        if (!sortable) return;
        sortable.destroy();
        container._sortable = createSortable(container, binding.value, vnode);
    },
    unbind(el: HTMLElement): void {
        const container = el.querySelector('.taginput-container') as SortableHTMLElement;
        const sortable = container?._sortable;
        if (!sortable) return;
        sortable.destroy();
    }
}

export { sortable };