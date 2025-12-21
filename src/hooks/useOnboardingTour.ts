import { useState, useEffect, useCallback, useRef } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useUserPermissions } from './useUserPermissions';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const TOUR_STORAGE_KEY = 'onboarding-tour-completed';
const TOUR_ENABLED_KEY = 'onboarding-tour-enabled';

export function useOnboardingTour() {
  const { permissions } = useUserPermissions();
  const { profile, roles } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const currentStepRef = useRef(0);
  
  const [isTourEnabled, setIsTourEnabled] = useState(() => {
    const stored = localStorage.getItem(TOUR_ENABLED_KEY);
    return stored !== 'false';
  });
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY);
    return stored === 'true';
  });
  const [isFirstAccess, setIsFirstAccess] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      const accessKey = `first-access-${profile.id}`;
      const hasAccessed = localStorage.getItem(accessKey);
      if (!hasAccessed && isTourEnabled) {
        setIsFirstAccess(true);
        localStorage.setItem(accessKey, 'true');
      }
    }
  }, [profile?.id, isTourEnabled]);

  const getUserRole = useCallback(() => {
    if (roles.some(r => r.role === 'superadmin')) return 'superadmin';
    if (roles.some(r => r.role === 'admin')) return 'admin';
    if (roles.some(r => r.role === 'manager')) return 'manager';
    if (roles.some(r => r.role === 'warehouse')) return 'warehouse';
    if (roles.some(r => r.role === 'technician')) return 'technician';
    return 'user';
  }, [roles]);

  // Wait for element to appear in DOM
  const waitForElement = (selector: string, timeout = 3000): Promise<Element | null> => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }, timeout);
    });
  };

  // Navigate and wait for content
  const navigateAndWait = async (path: string, elementSelector?: string) => {
    navigate(path);
    // give router/layout time to mount + paint
    await new Promise(resolve => setTimeout(resolve, 650));
    if (elementSelector) {
      await waitForElement(elementSelector, 8000);
    }
  };

  // Expand sidebar menu groups (works with our custom sidebar)
  const expandMenu = async (menuSelector: string) => {
    const menu = document.querySelector(menuSelector) as HTMLElement | null;
    if (!menu) return;

    // Our sidebar groups render a wrapper with data-tour + a Button trigger + a submenu div.
    const trigger = (menu.querySelector('button') as HTMLElement | null) || menu;
    const submenu = (menu.querySelector(':scope > div') as HTMLElement | null) || null;

    const isClosed = () => {
      if (!submenu) return false;
      return submenu.classList.contains('pointer-events-none') || submenu.classList.contains('max-h-0') || submenu.style.maxHeight === '0px';
    };

    if (submenu && isClosed()) {
      trigger.click();

      // wait until submenu is open (React state update)
      const start = Date.now();
      while (Date.now() - start < 2500) {
        if (!isClosed()) break;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  };

  const buildTourSteps = useCallback((): DriveStep[] => {
    const steps: DriveStep[] = [];
    const role = getUserRole();
    const firstName = profile?.full_name?.split(' ')[0] || '';

    // Step 1: Welcome Modal
    steps.push({
      popover: {
        title: `Olá${firstName ? `, ${firstName}` : ''}! 👋`,
        description: `
          <div style="margin-top: 8px;">
            <p>Bem-vindo ao sistema! Vou te mostrar as principais funcionalidades em poucos passos.</p>
            <div class="tour-tip-box" style="margin-top: 16px;">
              Use as setas ← → do teclado para navegar
            </div>
          </div>
        `,
        side: 'over',
        align: 'center',
        popoverClass: 'getninjas-tour tour-welcome-modal',
        onNextClick: async () => {
          if (location.pathname !== '/dashboard') {
            await navigateAndWait('/dashboard');
          }
          driverRef.current?.moveNext();
        }
      }
    });

    // Step 2: Sidebar Overview
    steps.push({
      element: '[data-tour="sidebar"]',
      popover: {
        title: '📱 Menu Principal',
        description: 'Este é o menu de navegação. Todas as funcionalidades do sistema estão organizadas aqui.',
        side: 'right',
        align: 'start',
        popoverClass: 'getninjas-tour',
      }
    });

    // Step 3: Dashboard
    if (permissions.page_dashboard) {
      steps.push({
        element: '[data-tour="dashboard"]',
        popover: {
          title: '📊 Dashboard',
          description: 'Sua central de informações! Veja métricas, gráficos e indicadores em tempo real.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await navigateAndWait('/dashboard', '[data-tour="dashboard-content"]');
            driverRef.current?.moveNext();
          }
        }
      });

      steps.push({
        element: '[data-tour="dashboard-content"]',
        popover: {
          title: '📈 Visão Geral',
          description: 'Aqui você acompanha todos os indicadores: estoque, obras, vendas, frota e equipe. Use os filtros no topo para customizar a visualização.',
          side: 'left',
          align: 'start',
          popoverClass: 'getninjas-tour',
        }
      });
    }

    // Step 4: Stock Module
    if (permissions.page_stock) {
      steps.push({
        element: '[data-tour="estoque"]',
        popover: {
          title: '📦 Estoque',
          description: 'Controle completo do seu inventário. Clique para expandir as opções.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await expandMenu('[data-tour="estoque"]');
            driverRef.current?.moveNext();
          }
        }
      });

      steps.push({
        element: '[data-tour="estoque-materiais"]',
        popover: {
          title: '🔧 Materiais',
          description: 'Gerencie materiais de consumo, ferramentas, equipamentos e EPIs.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await navigateAndWait('/estoque/materiais', '[data-tour="products-table"]');
            driverRef.current?.moveNext();
          }
        }
      });

      steps.push({
        element: '[data-tour="products-table"]',
        popover: {
          title: '📋 Lista de Produtos',
          description: `
            <p>Visualize todos os produtos cadastrados. Você pode:</p>
            <ul style="margin: 8px 0; padding-left: 16px;">
              <li>Pesquisar por nome ou código</li>
              <li>Filtrar por categoria</li>
              <li>Ver produtos em garantia</li>
            </ul>
          `,
          side: 'top',
          align: 'center',
          popoverClass: 'getninjas-tour',
        }
      });

      steps.push({
        element: '[data-tour="add-product-btn"]',
        popover: {
          title: '➕ Novo Produto',
          description: 'Clique aqui para cadastrar um novo item no estoque.',
          side: 'left',
          align: 'center',
          popoverClass: 'getninjas-tour',
        }
      });
    }

    // Step 5: Movimentação
    if (permissions.page_movimentacao) {
      steps.push({
        element: '[data-tour="movimentacao"]',
        popover: {
          title: '🔄 Movimentação',
          description: 'Registre entradas e saídas do estoque de forma rápida.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await navigateAndWait('/estoque/entrada', '[data-tour="movement-content"]');
            driverRef.current?.moveNext();
          }
        }
      });

      steps.push({
        element: '[data-tour="movement-content"]',
        popover: {
          title: '📝 Registrar Movimentação',
          description: 'Entradas (compras, devoluções) e saídas (uso em obras, transferências). Todo histórico fica salvo automaticamente.',
          side: 'left',
          align: 'start',
          popoverClass: 'getninjas-tour',
        }
      });
    }

    // Step 6: Teams
    if (permissions.page_teams) {
      steps.push({
        element: '[data-tour="equipes"]',
        popover: {
          title: '👥 Equipes',
          description: 'Organize seus colaboradores em equipes de trabalho.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await navigateAndWait('/equipes', '[data-tour="teams-content"]');
            driverRef.current?.moveNext();
          }
        }
      });

      steps.push({
        element: '[data-tour="teams-content"]',
        popover: {
          title: '👥 Gestão de Equipes',
          description: 'Defina líderes, vincule veículos e aloque equipes em obras ou ordens de serviço.',
          side: 'left',
          align: 'start',
          popoverClass: 'getninjas-tour',
        }
      });
    }

    // Step 7: HR
    if (permissions.page_hr) {
      steps.push({
        element: '[data-tour="rh"]',
        popover: {
          title: '👔 RH',
          description: 'Administração completa de pessoal.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await navigateAndWait('/rh', '[data-tour="hr-content"]');
            driverRef.current?.moveNext();
          }
        }
      });

      steps.push({
        element: '[data-tour="hr-content"]',
        popover: {
          title: '📋 Recursos Humanos',
          description: 'Cadastre funcionários, controle férias, licenças, documentos e folha de pagamento.',
          side: 'left',
          align: 'start',
          popoverClass: 'getninjas-tour',
        }
      });
    }

    // Step 8: Service Orders
    if (permissions.page_service_orders) {
      steps.push({
        element: '[data-tour="atendimento"]',
        popover: {
          title: '📝 Atendimento',
          description: 'Módulo de atendimento ao cliente e ordens de serviço.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await expandMenu('[data-tour="atendimento"]');
            driverRef.current?.moveNext();
          }
        }
      });

      steps.push({
        element: '[data-tour="ordens-servico"]',
        popover: {
          title: '🔧 Ordens de Serviço',
          description: 'Gerencie todas as O.S. da empresa.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await navigateAndWait('/os', '[data-tour="service-orders-content"]');
            driverRef.current?.moveNext();
          }
        }
      });

      steps.push({
        element: '[data-tour="service-orders-content"]',
        popover: {
          title: '📋 Lista de O.S.',
          description: 'Acompanhe status, prioridade e técnicos responsáveis. Filtre por período ou situação.',
          side: 'left',
          align: 'start',
          popoverClass: 'getninjas-tour',
        }
      });
    }

    // Step 9: Obras
    if (permissions.page_obras) {
      steps.push({
        element: '[data-tour="obras"]',
        popover: {
          title: '🏗️ Obras',
          description: 'Gestão de obras e projetos.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await navigateAndWait('/obras', '[data-tour="obras-content"]');
            driverRef.current?.moveNext();
          }
        }
      });

      steps.push({
        element: '[data-tour="obras-content"]',
        popover: {
          title: '🏗️ Acompanhamento',
          description: 'Registre obras, acompanhe progresso, gerencie diários e controle custos.',
          side: 'left',
          align: 'start',
          popoverClass: 'getninjas-tour',
        }
      });
    }

    // Step 10: Administrative
    if (permissions.page_fleet || permissions.page_reports) {
      steps.push({
        element: '[data-tour="administrativo"]',
        popover: {
          title: '🏢 Administrativo',
          description: 'Frota, notas fiscais e relatórios.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await expandMenu('[data-tour="administrativo"]');
            driverRef.current?.moveNext();
          }
        }
      });

      if (permissions.page_fleet) {
        steps.push({
          element: '[data-tour="frota"]',
          popover: {
            title: '🚗 Frota',
            description: 'Controle de veículos, abastecimentos e manutenções.',
            side: 'right',
            align: 'start',
            popoverClass: 'getninjas-tour',
            onNextClick: async () => {
              await navigateAndWait('/frota', '[data-tour="fleet-content"]');
              driverRef.current?.moveNext();
            }
          }
        });

        steps.push({
          element: '[data-tour="fleet-content"]',
          popover: {
            title: '🚗 Gestão de Frota',
            description: 'Cadastre veículos, registre abastecimentos e agende manutenções preventivas.',
            side: 'left',
            align: 'start',
            popoverClass: 'getninjas-tour',
          }
        });
      }

      if (permissions.page_reports) {
        steps.push({
          element: '[data-tour="relatorios"]',
          popover: {
            title: '📊 Relatórios',
            description: 'Relatórios detalhados de todas as áreas.',
            side: 'right',
            align: 'start',
            popoverClass: 'getninjas-tour',
            onNextClick: async () => {
              await navigateAndWait('/relatorios', '[data-tour="reports-content"]');
              driverRef.current?.moveNext();
            }
          }
        });

        steps.push({
          element: '[data-tour="reports-content"]',
          popover: {
            title: '📊 Central de Relatórios',
            description: 'Gere relatórios de inventário, garantias, obras e mais. Exporte para PDF ou Excel.',
            side: 'left',
            align: 'start',
            popoverClass: 'getninjas-tour',
          }
        });
      }
    }

    // Step 11: Notifications
    steps.push({
      element: '[data-tour="notifications"]',
      popover: {
        title: '🔔 Notificações',
        description: 'Alertas de estoque baixo, manutenções pendentes e lembretes importantes aparecem aqui.',
        side: 'bottom',
        align: 'end',
        popoverClass: 'getninjas-tour',
      }
    });

    // Step 12: User Menu
    steps.push({
      element: '[data-tour="user-menu"]',
      popover: {
        title: '👤 Seu Perfil',
        description: 'Acesse configurações, altere o tema, instale o app no celular e reinicie este tour quando quiser.',
        side: 'bottom',
        align: 'end',
        popoverClass: 'getninjas-tour',
      }
    });

    // Step 13: Settings (if available)
    if (permissions.page_settings) {
      steps.push({
        element: '[data-tour="settings"]',
        popover: {
          title: '⚙️ Configurações',
          description: 'Configure sua filial e gerencie usuários.',
          side: 'right',
          align: 'start',
          popoverClass: 'getninjas-tour',
          onNextClick: async () => {
            await navigateAndWait('/configuracoes', '[data-tour="settings-content"]');
            driverRef.current?.moveNext();
          }
        }
      });

      steps.push({
        element: '[data-tour="settings-content"]',
        popover: {
          title: '⚙️ Configurações',
          description: 'Edite dados da filial, logotipos e gerencie permissões de usuários.',
          side: 'left',
          align: 'start',
          popoverClass: 'getninjas-tour',
        }
      });
    }

    // Role-specific tips
    let roleTip = '';
    if (role === 'admin' || role === 'superadmin') {
      roleTip = 'Como administrador, você tem acesso completo. Use as Configurações para gerenciar usuários e permissões.';
    } else if (role === 'warehouse') {
      roleTip = 'Foque no controle de estoque! Use auditorias regularmente e registre todas as movimentações.';
    } else if (role === 'technician') {
      roleTip = 'Registre diários de obra diariamente e mantenha suas O.S. sempre atualizadas!';
    }

    if (roleTip) {
      steps.push({
        popover: {
          title: '💡 Dica para você',
          description: roleTip,
          side: 'over',
          align: 'center',
          popoverClass: 'getninjas-tour tour-welcome-modal',
        }
      });
    }

    // Final step
    steps.push({
      popover: {
        title: '🎉 Pronto!',
        description: `
          <div>
            <p>Agora você já conhece o sistema!</p>
            <p style="margin-top: 12px; color: hsl(var(--muted-foreground));">
              Para rever este tour, clique no seu avatar e selecione <strong>"Reiniciar Tour"</strong>.
            </p>
          </div>
        `,
        side: 'over',
        align: 'center',
        popoverClass: 'getninjas-tour tour-welcome-modal',
        onNextClick: async () => {
          await navigateAndWait('/dashboard');
          driverRef.current?.destroy();
        }
      }
    });

    return steps;
  }, [permissions, profile?.full_name, getUserRole, navigate, location.pathname]);

  const startTour = useCallback(() => {
    // Navigate to dashboard first
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }

    setTimeout(() => {
      const steps = buildTourSteps();
      
      driverRef.current = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        steps: steps,
        nextBtnText: 'Próximo',
        prevBtnText: 'Voltar',
        doneBtnText: 'Concluir',
        progressText: '{{current}} de {{total}}',
        popoverClass: 'getninjas-tour',
        overlayColor: 'rgba(0, 0, 0, 0.65)',
        stagePadding: 12,
        stageRadius: 10,
        popoverOffset: 20,
        animate: true,
        allowClose: true,
        smoothScroll: true,
        disableActiveInteraction: false,
        onHighlightStarted: (element, step, options) => {
          currentStepRef.current = options.state.activeIndex || 0;
        },
        onDestroyStarted: () => {
          setHasCompletedTour(true);
          localStorage.setItem(TOUR_STORAGE_KEY, 'true');
          driverRef.current?.destroy();
        },
      });

      driverRef.current.drive();
    }, 600);
  }, [buildTourSteps, location.pathname, navigate]);

  const toggleTourEnabled = useCallback(() => {
    const newState = !isTourEnabled;
    setIsTourEnabled(newState);
    localStorage.setItem(TOUR_ENABLED_KEY, String(newState));
    
    if (newState) {
      setHasCompletedTour(false);
      localStorage.removeItem(TOUR_STORAGE_KEY);
    }
  }, [isTourEnabled]);

  const resetTour = useCallback(() => {
    setHasCompletedTour(false);
    localStorage.removeItem(TOUR_STORAGE_KEY);
    if (profile?.id) {
      localStorage.removeItem(`first-access-${profile.id}`);
    }
    startTour();
  }, [profile?.id, startTour]);

  useEffect(() => {
    if (isFirstAccess && isTourEnabled && !hasCompletedTour) {
      const timer = setTimeout(() => {
        startTour();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isFirstAccess, isTourEnabled, hasCompletedTour, startTour]);

  return {
    isTourEnabled,
    hasCompletedTour,
    isFirstAccess,
    startTour,
    resetTour,
    toggleTourEnabled,
  };
}
