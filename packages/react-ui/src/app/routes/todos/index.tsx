import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckCircle,
  CircleDot,
  Tag,
  User,
  X,
  ListTodo,
  CheckCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { Checkbox } from '@/components/ui/checkbox';
import {
  CURSOR_QUERY_PARAM,
  DataTable,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { TableTitle } from '@/components/custom/table-title';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { projectMembersHooks } from '@/features/team/lib/project-members-hooks';
import { todoUtils } from '@/features/todos/lib/todo-utils';
import { todosApi } from '@/features/todos/lib/todos-api';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import {
  Todo,
  PopulatedTodo,
  UNRESOLVED_STATUS,
  STATUS_COLORS,
  STATUS_VARIANT,
} from '@activepieces/shared';

import { ApAvatar } from '../../../components/custom/ap-avatar';

import { TodoDetailsDrawer } from './todos-details-drawer';

function TodosPage() {
  const [selectedRows, setSelectedRows] = useState<Array<Todo>>([]);
  const [selectedTask, setSelectedTask] = useState<PopulatedTodo | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'needs-action'>('all');

  const location = useLocation();
  const projectId = authenticationSession.getProjectId()!;
  const platformId = authenticationSession.getPlatformId()!;
  const { data: currentUser } = userHooks.useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!location.search.includes('assignee')) {
      setSearchParams((prev) => {
        prev.set('status', UNRESOLVED_STATUS.name);
        return prev;
      });
    }
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['todos', location, projectId, activeTab],
    queryFn: () => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;
      const assigneeId = searchParams.get('assigneeId') ?? undefined;
      const flowId = searchParams.get('flowId') ?? undefined;
      const title = searchParams.get('title') ?? undefined;
      const statusOptions =
        activeTab === 'needs-action' ? [UNRESOLVED_STATUS.name] : undefined;

      return todosApi.list({
        projectId,
        cursor: cursor ?? undefined,
        limit,
        platformId,
        assigneeId,
        flowId,
        statusOptions,
        title,
      });
    },
  });

  const filteredData = useMemo(() => {
    if (!data?.data) return undefined;
    const searchParams = new URLSearchParams(location.search);
    const assigneeEmails = searchParams.getAll('assignee');

    if (assigneeEmails.length === 0) return data;

    return {
      data: data.data.filter(
        (task) => task.assignee && assigneeEmails.includes(task.assignee.email),
      ),
      next: data.next,
      previous: data.previous,
    };
  }, [data, location.search]);

  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const assigneeOptions = [
    ...(currentUser
      ? [
          {
            label: t('Me Only'),
            value: currentUser.email,
          },
        ]
      : []),
    ...(projectMembers
      ?.filter((member) => member.user.email !== currentUser?.email)
      .map((member) => ({
        label: `${member.user.firstName} ${member.user.lastName} (${member.user.email})`,
        value: member.user.email,
      })) ?? []),
  ];

  const filters = [
    {
      type: 'select',
      title: t('Assigned to'),
      accessorKey: 'assignee',
      icon: User,
      options: assigneeOptions ?? [],
    } as const,
    {
      type: 'input',
      title: t('Title'),
      accessorKey: 'title',
      icon: Tag,
      options: [],
    } as const,
  ];

  const getStatusIcon = (statusVariant: string) => {
    if (statusVariant === STATUS_VARIANT.NEGATIVE) {
      return X;
    }
    if (statusVariant === STATUS_VARIANT.POSITIVE) {
      return CheckCircle;
    }
    return CircleDot;
  };
  const columns: ColumnDef<RowDataWithActions<PopulatedTodo>, unknown>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()
          }
          onCheckedChange={(value) => {
            const isChecked = !!value;
            table.toggleAllPageRowsSelected(isChecked);

            if (isChecked) {
              const allRows = table
                .getRowModel()
                .rows.map((row) => row.original);

              const newSelectedRows = [...allRows, ...selectedRows];

              const uniqueRows = Array.from(
                new Map(
                  newSelectedRows.map((item) => [item.id, item]),
                ).values(),
              );

              setSelectedRows(uniqueRows);
            } else {
              const filteredRows = selectedRows.filter((row) => {
                return !table
                  .getRowModel()
                  .rows.some((r) => r.original.id === row.id);
              });
              setSelectedRows(filteredRows);
            }
          }}
        />
      ),
      cell: ({ row }) => {
        const isChecked = selectedRows.some(
          (selectedRow) => selectedRow.id === row.original.id,
        );
        return (
          <Checkbox
            checked={isChecked}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              let newSelectedRows = [...selectedRows];
              if (isChecked) {
                const exists = newSelectedRows.some(
                  (selectedRow) => selectedRow.id === row.original.id,
                );
                if (!exists) {
                  newSelectedRows.push(row.original);
                }
              } else {
                newSelectedRows = newSelectedRows.filter(
                  (selectedRow) => selectedRow.id !== row.original.id,
                );
              }
              setSelectedRows(newSelectedRows);
              row.toggleSelected(!!value);
            }}
          />
        );
      },
      accessorKey: 'select',
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Title')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">{row.original.title}</div>
        );
      },
    },
    {
      accessorKey: 'createdBy',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created by')} />
      ),
      cell: ({ row }) => {
        const authorName = todoUtils.getAuthorName(row.original);
        return (
          <div className="text-left flex items-center gap-2">
            <ApAvatar
              size="w-6 h-6"
              type={todoUtils.getAuthorType(row.original)}
              fullName={authorName}
              pictureUrl={todoUtils.getAuthorPictureUrl(row.original)}
              profileUrl={todoUtils.getAuthorProfileUrl(row.original)}
            />
            <div>{authorName}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'assignee',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Assigned to')} />
      ),
      cell: ({ row }) => {
        const hasAgent = row.original.agent;
        if (hasAgent) {
          return (
            <div className="text-left">
              <ApAvatar
                type="agent"
                size="w-6 h-6"
                includeName={true}
                pictureUrl={row.original.agent?.profilePictureUrl}
                profileUrl={
                  row.original.agent?.id
                    ? `/agents/${row.original.agent.id}`
                    : undefined
                }
                fullName={row.original.agent?.displayName ?? ''}
              />
            </div>
          );
        }

        return (
          <div className="text-left">
            {row.original.assignee && (
              <ApAvatar
                type="user"
                includeName={true}
                fullName={
                  row.original.assignee.firstName +
                  ' ' +
                  row.original.assignee.lastName
                }
              />
            )}
            {!row.original.assignee && <div className="text-left">-</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            <StatusIconWithText
              icon={getStatusIcon(row.original.status.variant)}
              text={row.original.status.name}
              color={STATUS_COLORS[row.original.status.variant].color}
              textColor={STATUS_COLORS[row.original.status.variant].textColor}
            />
          </div>
        );
      },
    },

    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Date Created')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {formatUtils.formatDate(new Date(row.original.created))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex-col w-full">
      <div className="flex items-center gap-2">
        <TableTitle
          description={t(
            'Manage todos for your project that are created by automations',
          )}
          beta={true}
        >
          {t('Todos')}
        </TableTitle>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'all' | 'needs-action')}
        className="mb-4"
      >
        <TabsList variant="outline">
          <TabsTrigger
            value="all"
            className="flex items-center gap-2"
            variant="outline"
          >
            <ListTodo className="h-4 w-4" />
            {t('All Todos')}
          </TabsTrigger>
          <TabsTrigger
            value="needs-action"
            className="flex items-center gap-2"
            variant="outline"
          >
            <CheckCheck className="h-4 w-4" />
            {t('Needs Action')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        emptyStateTextTitle={t('No todos found')}
        emptyStateTextDescription={t(
          'You do not have any pending todos. Great job!',
        )}
        emptyStateIcon={<CheckCircle className="size-14" />}
        columns={columns}
        page={filteredData}
        isLoading={isLoading}
        filters={filters}
        onRowClick={(row) => {
          setSelectedTask(row);
          setDrawerOpen(true);
        }}
      />
      {selectedTask && (
        <TodoDetailsDrawer
          key={selectedTask.id}
          currentTodo={selectedTask}
          onStatusChange={() => {
            setSelectedTask(null);
            refetch();
            setDrawerOpen(false);
          }}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onClose={() => {
            setSelectedTask(null);
            setDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}

export { TodosPage };
