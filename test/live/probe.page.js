const m = game.modules.get('custom-css');
return { active: m?.active, version: m?.version, world: game.world.id, user: game.user.name,
  cm: !!customElements.get('code-mirror'), w: game.settings.get('custom-css', 'worldStylesheet')?.length };
