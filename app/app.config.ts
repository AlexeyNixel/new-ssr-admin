export default defineAppConfig({
  ui: {
    modal: {
      slots: {
        content: 'rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg',

        overlay: 'backdrop-blur-sm !bg-black/50',
        wrapper: 'items-center justify-center p-4',
      },
    },
  },
});
