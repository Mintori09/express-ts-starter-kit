export default {
    'src/**/*.{ts,js}': [
        'prettier --write',
        // Run a full build (type-check) for the whole project.
        // We use a function to ignore the list of changed files passed by lint-staged.
        () => 'pnpm build',
        'pnpm test --findRelatedTests',
    ],
}
